// src/enseignants/enseignants.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateEnseignantDto } from './dto/create-enseignant.dto'; // <-- Supprimer cet import
import { UpdateEnseignantDto } from './dto/update-enseignant.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Role } from '@prisma/client';

@Injectable()
export class EnseignantsService {
  constructor(private prisma: PrismaService) {}

  // /**
  //  * @deprecated La création d'un enseignant doit se faire via /auth/register
  //  * Crée un nouveau profil d'enseignant, lié à un utilisateur existant avec le rôle ENSEIGNANT.
  //  * @param createEnseignantDto Les données nécessaires pour créer le profil enseignant, incluant l'ID de l'utilisateur.
  //  * @returns Le profil enseignant créé, incluant les détails de l'utilisateur associé.
  //  */
  // async create(createEnseignantDto: CreateEnseignantDto) {
  //   // Cette méthode est supprimée, la logique est déplacée dans AuthService.register
  //   // (Je l'ai commentée ici pour illustrer ce qui doit être retiré)
  // }


  /**
   * Récupère tous les profils d'enseignants avec leurs utilisateurs associés.
   * @returns Une liste de tous les profils d'enseignants.
   */
  async findAll() {
    try {
      return await this.prisma.enseignant.findMany({
        include: {
          utilisateur: {
            select: { id: true, nom: true, email: true, role: true },
          },
          // Inclure les matières enseignées et leurs niveaux
          matieres: {
            include: { matiere: { include: { niveau: true } } },
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erreur interne du serveur lors de la récupération des profils enseignants.');
    }
  }

  /**
   * Récupère un profil d'enseignant spécifique par son ID, avec son utilisateur associé.
   * Lance une NotFoundException si le profil n'existe pas.
   * @param id L'ID du profil enseignant à récupérer.
   * @returns Le profil d'enseignant trouvé.
   */
  async findOne(id: string) {
    try {
      const enseignant = await this.prisma.enseignant.findUnique({
        where: { id },
        include: {
          utilisateur: {
            select: { id: true, nom: true, email: true, role: true },
          },
          // Inclure les matières enseignées et leurs niveaux
          matieres: {
            include: { matiere: { include: { niveau: true } } },
          },
        },
      });
      if (!enseignant) {
        throw new NotFoundException(`Profil enseignant avec l'ID "${id}" introuvable.`);
      }
      return enseignant;
    } catch (error) {
      if (error instanceof NotFoundException) {
          throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Profil enseignant avec l'ID "${id}" introuvable.`);
      }
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la récupération du profil enseignant avec l'ID "${id}".`);
    }
  }

  /**
   * Met à jour un profil d'enseignant existant par son ID.
   * Permet de modifier des champs spécifiques au profil enseignant (comme 'poste').
   * @param id L'ID du profil enseignant à mettre à jour.
   * @param updateEnseignantDto Les données de mise à jour.
   * @returns Le profil d'enseignant mis à jour.
   */
  async update(id: string, updateEnseignantDto: UpdateEnseignantDto) {
    try {
      const existingEnseignant = await this.prisma.enseignant.findUnique({ where: { id } });
      if (!existingEnseignant) {
        throw new NotFoundException(`Profil enseignant avec l'ID "${id}" introuvable.`);
      }

      // La vérification de utilisateurId a été supprimée, car elle n'est plus dans UpdateEnseignantDto
      // et utilisateurId ne devrait pas être modifiable après la création.
      // Si updateEnseignantDto contient d'autres champs (comme 'poste'), ils seront mis à jour ici.

      const enseignant = await this.prisma.enseignant.update({
        where: { id },
        data: updateEnseignantDto, // Cela mettra à jour les champs présents dans updateEnseignantDto (ex: poste)
        include: {
          utilisateur: {
            select: { id: true, nom: true, email: true, role: true },
          },
          matieres: { // N'oubliez pas d'inclure les matières si ce n'est pas déjà fait
            include: { matiere: { include: { niveau: true } } },
          },
        },
      });
      return enseignant;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) {
          throw error;
      }
      // Gérer les erreurs spécifiques si d'autres champs avec contraintes uniques sont ajoutés à UpdateEnseignantDto
      // Par exemple, si vous aviez un 'codeEnseignant' unique:
      // if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002' && error.meta?.target?.includes('codeEnseignant')) {
      //   throw new ConflictException(`Le code enseignant "${updateEnseignantDto.codeEnseignant}" est déjà utilisé.`);
      // }
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la mise à jour du profil enseignant avec l'ID "${id}".`);
    }
  }

  /**
   * Supprime un profil d'enseignant par son ID.
   * Gère les cas où le profil n'existe pas ou s'il est lié à des séances ou matières (contrainte de clé étrangère).
   * Ne supprime PAS l'utilisateur associé.
   * @param id L'ID du profil enseignant à supprimer.
   * @returns Un message de succès.
   */
  async remove(id: string) {
    try {
      const existingEnseignant = await this.prisma.enseignant.findUnique({ where: { id } });
      if (!existingEnseignant) {
        throw new NotFoundException(`Profil enseignant avec l'ID "${id}" introuvable.`);
      }

      await this.prisma.enseignant.delete({ where: { id } });
      return { message: 'Profil enseignant supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) {
          throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(`Impossible de supprimer le profil enseignant avec l'ID "${id}" car il est lié à des séances ou des associations de matières. Déliez-le d'abord.`);
      }
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la suppression du profil enseignant avec l'ID "${id}".`);
    }
  }
}