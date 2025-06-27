// src/etudiants/etudiants.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateEtudiantDto } from './dto/create-etudiant.dto'; // <-- Supprimer cet import
import { UpdateEtudiantDto } from './dto/update-etudiant.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Role } from '@prisma/client';

@Injectable()
export class EtudiantsService {
  constructor(private prisma: PrismaService) {}

  // La méthode 'create' est supprimée car la création d'un profil étudiant
  // se fait désormais uniquement via la route d'inscription (/auth/register).
  // /**
  //  * Crée un nouveau profil étudiant, en l'associant à un utilisateur existant (rôle ETUDIANT) et à un niveau.
  //  * @param createEtudiantDto Les données pour créer le profil étudiant.
  //  * @returns Le profil étudiant créé.
  //  */
  // async create(createEtudiantDto: CreateEtudiantDto) {
  //   // ... (logique de création supprimée)
  // }

  /**
   * Récupère tous les profils étudiants, avec leurs utilisateurs et niveaux associés.
   * @returns Une liste de tous les profils étudiants.
   */
  async findAll() {
    try {
      return await this.prisma.etudiant.findMany({
        include: {
          utilisateur: { select: { id: true, nom: true, email: true, role: true } },
          niveau: { include: { departement: true } },
        },
        orderBy: { utilisateur: { nom: 'asc' } }, // Tri par nom d'utilisateur
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des profils étudiants:', error);
      throw new InternalServerErrorException(
        'Erreur interne du serveur lors de la récupération des profils étudiants.',
      );
    }
  }

  /**
   * Récupère un profil étudiant spécifique par son ID, avec ses relations.
   * @param id L'ID du profil étudiant.
   * @returns Le profil étudiant trouvé.
   */
  async findOne(id: string) {
    try {
      const etudiant = await this.prisma.etudiant.findUnique({
        where: { id },
        include: {
          utilisateur: { select: { id: true, nom: true, email: true, role: true } },
          niveau: { include: { departement: true } },
        },
      });
      if (!etudiant) {
        throw new NotFoundException(`Profil étudiant avec l'ID "${id}" introuvable.`);
      }
      return etudiant;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Gérer l'erreur P2025 si l'enregistrement n'est pas trouvé par Prisma (findUnique)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Profil étudiant avec l'ID "${id}" introuvable.`);
      }
      console.error('Erreur lors de la récupération du profil étudiant:', error);
      throw new InternalServerErrorException(
        `Erreur interne du serveur lors de la récupération du profil étudiant avec l'ID "${id}".`,
      );
    }
  }

  /**
   * Met à jour un profil étudiant existant.
   * Permet de modifier le matricule et/ou le niveauId.
   * @param id L'ID du profil étudiant à mettre à jour.
   * @param updateEtudiantDto Les données de mise à jour.
   * @returns Le profil étudiant mis à jour.
   */
  async update(id: string, updateEtudiantDto: UpdateEtudiantDto) {
    const { niveauId, matricule } = updateEtudiantDto;
    try {
      // 1. Vérifier si le profil étudiant existe
      const existingEtudiant = await this.prisma.etudiant.findUnique({ where: { id } });
      if (!existingEtudiant) {
        throw new NotFoundException(`Profil étudiant avec l'ID "${id}" introuvable.`);
      }

      // 2. Si un nouveau niveauId est fourni, vérifier que ce niveau existe
      if (niveauId && niveauId !== existingEtudiant.niveauId) {
        const nouveauNiveau = await this.prisma.niveau.findUnique({
          where: { id: niveauId },
        });
        if (!nouveauNiveau) {
          throw new NotFoundException(`Le nouveau niveau avec l'ID "${niveauId}" est introuvable.`);
        }
      }

      // 3. Vérifier l'unicité du matricule si fourni et modifié
      // Cette vérification est cruciale car 'matricule' est @unique dans votre schema.prisma
      if (matricule && matricule !== existingEtudiant.matricule) {
        const existingMatricule = await this.prisma.etudiant.findUnique({
          where: { matricule: matricule },
        });
        if (existingMatricule) {
          throw new ConflictException(`Le matricule "${matricule}" est déjà utilisé par un autre étudiant.`);
        }
      }

      // 4. Mettre à jour le profil étudiant
      const updatedEtudiant = await this.prisma.etudiant.update({
        where: { id },
        data: {
          // Utilise le matricule fourni ou l'existant s'il n'est pas modifié
          matricule: matricule !== undefined ? matricule : existingEtudiant.matricule,
          // Connecte au nouveau niveau si niveauId est fourni, sinon ne modifie pas
          niveau: niveauId ? { connect: { id: niveauId } } : undefined,
          // Ne mettez pas à jour utilisateurId ici, car il ne doit pas être modifiable
        },
        include: {
          utilisateur: { select: { id: true, nom: true, email: true, role: true } },
          niveau: { include: { departement: true } },
        },
      });
      return updatedEtudiant;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      // Gérer l'erreur P2002 pour violation de contrainte unique (ex: matricule)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        if (error.meta?.target === 'matricule') {
          throw new ConflictException(`Le matricule "${matricule}" est déjà utilisé.`);
        }
      }
      console.error('Erreur lors de la mise à jour du profil étudiant:', error);
      throw new InternalServerErrorException(
        `Erreur interne du serveur lors de la mise à jour du profil étudiant avec l'ID "${id}".`,
      );
    }
  }

  /**
   * Supprime un profil étudiant par son ID.
   * Gère les cas où le profil n'existe pas ou s'il est lié à d'autres enregistrements (ex: séances, notes).
   * @param id L'ID du profil étudiant à supprimer.
   * @returns Un message de succès.
   */
  async remove(id: string) {
    try {
      // 1. Vérifier si le profil étudiant existe
      const existingEtudiant = await this.prisma.etudiant.findUnique({ where: { id } });
      if (!existingEtudiant) {
        throw new NotFoundException(`Profil étudiant avec l'ID "${id}" introuvable.`);
      }

      // TODO: Ajouter des vérifications pour les liaisons (Séances, Notes) ici
      // Si un étudiant est lié à des présences, notes ou autres, il faut empêcher la suppression
      // ou implémenter une suppression en cascade si c'est le comportement désiré.
      // Par exemple :
      // const presencesAssociees = await this.prisma.presence.count({ where: { etudiantId: id } });
      // if (presencesAssociees > 0) {
      //   throw new ConflictException(`L'étudiant ne peut pas être supprimé car il a des présences associées.`);
      // }

      // 2. Supprimer le profil étudiant
      await this.prisma.etudiant.delete({ where: { id } });
      return { message: 'Profil étudiant supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Gérer l'erreur P2003 pour violation de contrainte de clé étrangère
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(
          `Impossible de supprimer ce profil étudiant car il est lié à d'autres enregistrements.`,
        );
      }
      console.error('Erreur lors de la suppression du profil étudiant:', error);
      throw new InternalServerErrorException(
        `Erreur interne du serveur lors de la suppression du profil étudiant.`,
      );
    }
  }
}
