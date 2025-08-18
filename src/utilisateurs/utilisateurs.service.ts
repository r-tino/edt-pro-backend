// src/utilisateurs/utilisateurs.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto'; // Assurez-vous que ce DTO existe pour la méthode create
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto'; // Assurez-vous que ce DTO existe pour la méthode update
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt'; // Importez bcrypt pour le hachage du mot de passe

@Injectable()
export class UtilisateursService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée un nouvel utilisateur. Cette méthode est principalement pour les ADMINs
   * pour créer des utilisateurs directement, sans passer par le processus d'inscription complet
   * qui gère les profils. Pour l'inscription avec profils, utilisez auth.register.
   * @param createUtilisateurDto Les données pour créer l'utilisateur.
   * @returns L'utilisateur créé.
   */
  async create(createUtilisateurDto: CreateUtilisateurDto) {
  const { email, motDePasse, ...rest } = createUtilisateurDto;
  try {
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException(`L'utilisateur avec l'email "${email}" existe déjà.`);
    }

    // 🔑 Hash du mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    return await this.prisma.utilisateur.create({
      data: {
        ...rest,
        email,
        motDePasse: hashedPassword,
      },
    });
  } catch (error) {
    if (error instanceof ConflictException) {
      throw error;
    }
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(`L'email "${email}" est déjà utilisé.`);
    }
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    throw new InternalServerErrorException(
      'Erreur interne du serveur lors de la création de l\'utilisateur.'
    );
  }
}

  /**
   * Récupère tous les utilisateurs avec leurs profils (enseignant, étudiant) et relations imbriquées.
   * @returns Une liste de tous les utilisateurs.
   */
  async findAll() {
    try {
      return await this.prisma.utilisateur.findMany({
        include: {
          enseignant: {
            include: {
              matieres: {
                include: {
                  matiere: {
                    include: {
                      niveau: true // Inclure le niveau de la matière
                    }
                  }
                }
              }
            }
          },
          etudiant: {
            include: {
              niveau: {
                include: {
                  departement: true // Inclure le département du niveau de l'étudiant
                }
              }
            }
          },
        },
        orderBy: { nom: 'asc' }, // Tri par nom d'utilisateur
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw new InternalServerErrorException('Erreur interne du serveur lors de la récupération des utilisateurs.');
    }
  }

  /**
   * Récupère un utilisateur spécifique par son ID, avec ses profils et relations.
   * @param id L'ID de l'utilisateur.
   * @returns L'utilisateur trouvé.
   */
  async findOne(id: string) {
    try {
      const utilisateur = await this.prisma.utilisateur.findUnique({
        where: { id },
        include: {
          enseignant: {
            include: {
              matieres: {
                include: {
                  matiere: {
                    include: {
                      niveau: true
                    }
                  }
                }
              }
            }
          },
          etudiant: {
            include: {
              niveau: {
                include: {
                  departement: true
                }
              }
            }
          },
        },
      });
      if (!utilisateur) {
        throw new NotFoundException(`Utilisateur avec l'ID "${id}" introuvable.`);
      }
      return utilisateur;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Utilisateur avec l'ID "${id}" introuvable.`);
      }
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la récupération de l'utilisateur avec l'ID "${id}".`);
    }
  }

  /**
   * Met à jour un utilisateur existant et son profil associé.
   * @param id L'ID de l'utilisateur à mettre à jour.
   * @param updateUtilisateurDto Les données de mise à jour.
   * @returns L'utilisateur mis à jour.
   */
  async update(id: string, updateUtilisateurDto: UpdateUtilisateurDto) {
    const { nom, email, motDePasse, role, etudiantProfile, enseignantProfile } = updateUtilisateurDto;

    try {
      const existingUser = await this.prisma.utilisateur.findUnique({ where: { id } });
      if (!existingUser) {
        throw new NotFoundException(`Utilisateur avec l'ID "${id}" introuvable.`);
      }

      // Vérifier si l'email est modifié et s'il est déjà utilisé par un autre utilisateur
      if (email && email !== existingUser.email) {
        const emailConflict = await this.prisma.utilisateur.findUnique({ where: { email } });
        if (emailConflict && emailConflict.id !== id) {
          throw new ConflictException(`L'email "${email}" est déjà utilisé par un autre utilisateur.`);
        }
      }

      // Hasher le nouveau mot de passe si fourni
      let hashedPassword = existingUser.motDePasse;
      if (motDePasse) {
        hashedPassword = await bcrypt.hash(motDePasse, 10);
      }

      // Mettre à jour l'utilisateur de base
      const updatedUser = await this.prisma.utilisateur.update({
        where: { id },
        data: {
          nom: nom ?? existingUser.nom,
          email: email ?? existingUser.email,
          motDePasse: hashedPassword,
          role: role ?? existingUser.role, // Permettre le changement de rôle si nécessaire
        },
      });

      // Mettre à jour ou créer le profil spécifique si le rôle change ou si des données de profil sont fournies
      if (role === Role.ETUDIANT) {
        if (etudiantProfile) {
          // Si l'utilisateur avait un profil enseignant, le supprimer
          if (existingUser.role === Role.ENSEIGNANT) {
            await this.prisma.enseignant.deleteMany({ where: { utilisateurId: id } });
          }

          // Mettre à jour ou créer le profil étudiant
          await this.prisma.etudiant.upsert({
            where: { utilisateurId: id },
            update: {
              matricule: etudiantProfile.matricule,
              niveauId: etudiantProfile.niveauId,
            },
            create: {
              utilisateurId: id,
              matricule: etudiantProfile.matricule,
              niveauId: etudiantProfile.niveauId,
            },
          });
        }
      } else if (role === Role.ENSEIGNANT) {
        if (enseignantProfile) {
          // Si l'utilisateur avait un profil étudiant, le supprimer
          if (existingUser.role === Role.ETUDIANT) {
            await this.prisma.etudiant.deleteMany({ where: { utilisateurId: id } });
          }

          // Mettre à jour ou créer le profil enseignant
          const updatedEnseignant = await this.prisma.enseignant.upsert({
            where: { utilisateurId: id },
            update: {
              poste: enseignantProfile.poste,
            },
            create: {
              utilisateurId: id,
              poste: enseignantProfile.poste,
            },
            include: { matieres: true } // Inclure les matières existantes pour comparaison
          });

          // Gérer les matières enseignées
          if (enseignantProfile.matieresNiveaux) {
            const currentMatiereIds = new Set(updatedEnseignant.matieres.map(m => m.matiereId));
            const newMatiereIds = new Set(enseignantProfile.matieresNiveaux.map(mn => mn.matiereId));

            // Matières à déconnecter (supprimer)
            const matieresToRemove = [...currentMatiereIds].filter(matiereId => !newMatiereIds.has(matiereId));
            if (matieresToRemove.length > 0) {
              await this.prisma.enseignantMatiere.deleteMany({
                where: {
                  enseignantId: updatedEnseignant.id,
                  matiereId: { in: matieresToRemove },
                },
              });
            }

            // Matières à connecter (ajouter)
            const matieresToAdd = enseignantProfile.matieresNiveaux.filter(mn => !currentMatiereIds.has(mn.matiereId));
            if (matieresToAdd.length > 0) {
              // Vérifier l'existence et la cohérence matière/niveau avant d'ajouter
              for (const { matiereId, niveauId } of matieresToAdd) {
                const matiereNiveauExists = await this.prisma.matiere.findUnique({
                  where: { id: matiereId, niveauId: niveauId },
                });
                if (!matiereNiveauExists) {
                  throw new BadRequestException(
                    `La matière avec l'ID "${matiereId}" n'existe pas pour le niveau "${niveauId}".`,
                  );
                }
              }
              await this.prisma.enseignantMatiere.createMany({
                data: matieresToAdd.map(mn => ({
                  enseignantId: updatedEnseignant.id,
                  matiereId: mn.matiereId,
                })),
                skipDuplicates: true,
              });
            }
          }
        }
      } else if (role === Role.ADMIN) {
        // Si le rôle devient ADMIN, supprimer les profils étudiant/enseignant existants
        if (existingUser.role === Role.ETUDIANT) {
          await this.prisma.etudiant.deleteMany({ where: { utilisateurId: id } });
        } else if (existingUser.role === Role.ENSEIGNANT) {
          await this.prisma.enseignant.deleteMany({ where: { utilisateurId: id } });
        }
      }

      // Retourner l'utilisateur mis à jour avec ses nouvelles relations
      return await this.findOne(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') { // Violation de contrainte unique (ex: email, matricule)
          if (error.meta?.target === 'email') {
            throw new ConflictException(`L'email "${email}" est déjà utilisé.`);
          }
          if (error.meta?.target === 'matricule') {
            throw new ConflictException(`Le matricule est déjà utilisé.`);
          }
        }
      }
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw new InternalServerErrorException(
        `Erreur interne du serveur lors de la mise à jour de l'utilisateur avec l'ID "${id}".`,
      );
    }
  }

  /**
   * Supprime un utilisateur par son ID.
   * Gère la suppression en cascade des profils liés (enseignant, étudiant).
   * @param id L'ID de l'utilisateur à supprimer.
   * @returns Un message de succès.
   */
  async remove(id: string) {
    try {
      const utilisateur = await this.prisma.utilisateur.findUnique({
        where: { id },
        include: { enseignant: true, etudiant: true },
      });

      if (!utilisateur) {
        throw new NotFoundException(`Utilisateur avec l'ID "${id}" introuvable.`);
      }

      // Supprimer les profils associés en premier
      if (utilisateur.enseignant) {
        // Supprimer d'abord les liaisons EnseignantMatiere
        await this.prisma.enseignantMatiere.deleteMany({
          where: { enseignantId: utilisateur.enseignant.id },
        });
        // Puis supprimer le profil Enseignant
        await this.prisma.enseignant.delete({ where: { id: utilisateur.enseignant.id } });
      }
      if (utilisateur.etudiant) {
        await this.prisma.etudiant.delete({ where: { id: utilisateur.etudiant.id } });
      }

      // Supprimer l'utilisateur
      await this.prisma.utilisateur.delete({ where: { id } });
      return { message: 'Utilisateur supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(`Impossible de supprimer l'utilisateur avec l'ID "${id}" car il est lié à d'autres enregistrements (ex: séances, notes).`);
      }
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la suppression de l'utilisateur.`);
    }
  }
}
