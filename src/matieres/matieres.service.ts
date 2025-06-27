// src/matieres/matieres.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class MatieresService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée une nouvelle matière associée à un niveau spécifique.
   * Gère les conflits si une matière avec le même nom existe déjà dans le MÊME niveau.
   * @param createMatiereDto Les données pour créer la matière (nom et niveauId).
   * @returns La matière créée avec les détails du niveau.
   */
  async create(createMatiereDto: CreateMatiereDto) {
    const { nom, niveauId } = createMatiereDto;
    try {
      // 1. Vérifier si le niveau existe
      const niveau = await this.prisma.niveau.findUnique({
        where: { id: niveauId },
        include: { departement: true }, // Inclure le département pour un message d'erreur plus clair
      });
      if (!niveau) {
        throw new NotFoundException(`Le niveau avec l'ID "${niveauId}" est introuvable.`);
      }

      // 2. Vérifier si une matière avec ce nom existe déjà pour ce niveau spécifique
      const existingMatiere = await this.prisma.matiere.findFirst({
        where: {
          nom: {
            equals: nom,
            mode: 'insensitive', // Ignore la casse (ex: "Maths" et "maths" sont considérés identiques)
          },
          niveauId: niveauId,
        },
      });

      if (existingMatiere) {
        throw new ConflictException(
          `Une matière nommée "${nom}" existe déjà pour le niveau "${niveau.nom}" du département "${niveau.departement.nom}".`,
        );
      }

      // 3. Créer la matière dans la base de données
      const matiere = await this.prisma.matiere.create({
        data: {
          nom,
          niveau: {
            connect: { id: niveauId },
          },
        },
        include: { niveau: { include: { departement: true } } }, // Inclure le niveau et son département dans la réponse
      });
      return matiere;
    } catch (error) {
      // Gérer les exceptions NestJS déjà gérées (NotFoundException, ConflictException)
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      // Gérer les erreurs spécifiques de Prisma pour les violations de contrainte (P2002)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        // Cela pourrait arriver si la contrainte est sur (nom, niveauId) par exemple
        throw new ConflictException(`Une matière avec le nom '${nom}' existe déjà pour ce niveau.`);
      }
      // Pour toute autre erreur inattendue
      console.error('Erreur lors de la création de la matière:', error); // Log l'erreur pour le débogage
      throw new InternalServerErrorException('Erreur interne du serveur lors de la création de la matière.');
    }
  }

  /**
   * Récupère toutes les matières de la base de données, avec leurs niveaux et départements associés.
   * @returns Une liste de toutes les matières.
   */
  async findAll(niveauId: string | undefined) {
    try {
      return await this.prisma.matiere.findMany({
        include: { niveau: { include: { departement: true } } }, // Inclure le niveau et le département
        orderBy: { nom: 'asc' }, // Trier par nom de matière
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des matières:', error);
      throw new InternalServerErrorException('Erreur interne du serveur lors de la récupération des matières.');
    }
  }

  /**
   * Récupère une matière spécifique par son ID, avec son niveau et département associés.
   * Lance une NotFoundException si la matière n'existe pas.
   * @param id L'ID de la matière à récupérer.
   * @returns La matière trouvée.
   */
  async findOne(id: string) {
    try {
      const matiere = await this.prisma.matiere.findUnique({
        where: { id },
        include: { niveau: { include: { departement: true } } }, // Inclure le niveau et le département
      });
      if (!matiere) {
        throw new NotFoundException(`Matière avec l'ID "${id}" introuvable.`);
      }
      return matiere;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Matière avec l'ID "${id}" introuvable.`);
      }
      console.error('Erreur lors de la récupération de la matière:', error);
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la récupération de la matière avec l'ID "${id}".`);
    }
  }

  /**
   * Met à jour une matière existante par son ID.
   * Gère les cas où la matière ou le nouveau niveau n'existe pas, ou si la mise à jour crée un conflit de nom dans le même niveau.
   * @param id L'ID de la matière à mettre à jour.
   * @param updateMatiereDto Les données de mise à jour (nom, niveauId).
   * @returns La matière mise à jour avec les détails du niveau.
   */
  async update(id: string, updateMatiereDto: UpdateMatiereDto) {
    const { nom, niveauId } = updateMatiereDto;
    try {
      // 1. Vérifier si la matière existe
      const existingMatiere = await this.prisma.matiere.findUnique({
        where: { id },
        include: { niveau: true }, // Inclure le niveau pour les vérifications de conflit
      });
      if (!existingMatiere) {
        throw new NotFoundException(`Matière avec l'ID "${id}" introuvable.`);
      }

      // 2. Si un nouveau niveauId est fourni, vérifier que ce niveau existe
      if (niveauId && niveauId !== existingMatiere.niveauId) {
        const nouveauNiveau = await this.prisma.niveau.findUnique({
          where: { id: niveauId },
        });
        if (!nouveauNiveau) {
          throw new NotFoundException(`Le nouveau niveau avec l'ID "${niveauId}" est introuvable.`);
        }
      }

      // 3. Vérifier les conflits de nom de matière dans le niveau cible (ancien ou nouveau)
      // Le nom à vérifier est celui fourni dans le DTO ou le nom existant de la matière
      const targetNom = nom !== undefined ? nom : existingMatiere.nom;
      // Le niveauId cible est celui fourni dans le DTO ou le niveauId existant
      const targetNiveauId = niveauId !== undefined ? niveauId : existingMatiere.niveauId;

      // Chercher une autre matière (dont l'ID est différent de la matière actuelle)
      // qui aurait le même nom dans le niveau cible.
      const nameConflict = await this.prisma.matiere.findFirst({
        where: {
          nom: {
            equals: targetNom,
            mode: 'insensitive',
          },
          niveauId: targetNiveauId,
          NOT: {
            id: id, // Exclure la matière que nous sommes en train de modifier
          },
        },
      });

      if (nameConflict) {
        // Pour un message d'erreur plus détaillé
        const conflitNiveau = await this.prisma.niveau.findUnique({
          where: { id: targetNiveauId },
          include: { departement: true },
        });
        throw new ConflictException(
          `Une matière nommée "${targetNom}" existe déjà pour le niveau "${conflitNiveau?.nom}" du département "${conflitNiveau?.departement.nom}".`,
        );
      }

      // 4. Mettre à jour la matière
      const updatedMatiere = await this.prisma.matiere.update({
        where: { id },
        data: {
          nom: nom, // Update 'nom' only if provided, otherwise keep existing
          niveau: niveauId ? { connect: { id: niveauId } } : undefined, // Update 'niveauId' only if provided
        },
        include: { niveau: { include: { departement: true } } }, // Inclure le niveau et son département dans la réponse
      });
      return updatedMatiere;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        // Cela gère les cas où Prisma intercepte un conflit d'unicité avant notre logique
        throw new ConflictException(`Une matière avec le nom '${nom}' existe déjà pour ce niveau.`);
      }
      console.error('Erreur lors de la mise à jour de la matière:', error);
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la mise à jour de la matière avec l'ID "${id}".`);
    }
  }

  /**
   * Supprime une matière par son ID.
   * Gère les cas où la matière n'existe pas ou si elle est liée à d'autres enregistrements (ex: EnseignantMatiere, Séances).
   * @param id L'ID de la matière à supprimer.
   * @returns Un message de succès.
   */
  async remove(id: string) {
    try {
      // Vérifier si la matière existe avant de tenter la suppression
      const existingMatiere = await this.prisma.matiere.findUnique({ where: { id } });
      if (!existingMatiere) {
        throw new NotFoundException(`Matière avec l'ID "${id}" introuvable.`);
      }

      // TODO: Ajouter des vérifications pour les liaisons (EnseignantMatiere, Séances) ici
      // Avant de supprimer une matière, vérifiez si elle est associée à des séances ou à des enseignants.
      // Cela nécessite d'implémenter les modules pour ces entités.
      // Par exemple :
      // const seancesAssociees = await this.prisma.seance.count({ where: { matiereId: id } });
      // if (seancesAssociees > 0) {
      //   throw new ConflictException(`La matière "${existingMatiere.nom}" ne peut pas être supprimée car elle a des séances associées.`);
      // }
      // const enseignantMatieresAssociees = await this.prisma.enseignantMatiere.count({ where: { matiereId: id } });
      // if (enseignantMatieresAssociees > 0) {
      //   throw new ConflictException(`La matière "${existingMatiere.nom}" ne peut pas être supprimée car elle est associée à des enseignants.`);
      // }

      await this.prisma.matiere.delete({ where: { id } });
      return { message: 'Matière supprimée avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Gérer l'erreur spécifique de Prisma pour les violations de contrainte de clé étrangère (P2003)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(
          `Impossible de supprimer cette matière car elle est liée à d'autres enregistrements (ex: séances ou attributions aux enseignants).`,
        );
      }
      console.error('Erreur lors de la suppression de la matière:', error);
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la suppression de la matière.`);
    }
  }
}