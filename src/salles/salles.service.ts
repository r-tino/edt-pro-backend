// src/salles/salles.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSalleDto } from './dto/create-salle.dto';
import { UpdateSalleDto } from './dto/update-salle.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class SallesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée une nouvelle salle dans la base de données.
   * Vérifie si une salle avec le même nom existe déjà avant de créer.
   * Lance une ConflictException si c'est le cas.
   * Gère les erreurs de base de données spécifiques, comme les violations de contrainte unique.
   * @param createSalleDto Les données de la salle à créer.
   * @returns La salle créée.
   */

  async create(createSalleDto: CreateSalleDto) {
    try {
      // Vérifier si une salle avec le même nom existe déjà
      const existingSalle = await this.prisma.salle.findUnique({
        where: { nom: createSalleDto.nom },
      });
      // Si une salle avec le même nom existe, lancer une ConflictException
      if (existingSalle) {
        throw new ConflictException(`Une salle avec le nom "${createSalleDto.nom}" existe déjà.`);
      }
      // Créer la salle si aucune salle avec le même nom n'existe
      return await this.prisma.salle.create({ data: createSalleDto });
    } catch (error) {
      // Gérer l'erreur spécifique de Prisma pour les violations de contrainte unique (P2002)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        if (error.meta?.target === 'nom') {
          throw new ConflictException(`Le nom de salle "${createSalleDto.nom}" est déjà utilisé.`);
        }
      }
      // Re-lancer les exceptions NestJS que nous avons déjà gérées
      if (error instanceof ConflictException) {
          throw error;
      }
      // Pour toute autre erreur, lancer une InternalServerErrorException
      throw new InternalServerErrorException('Erreur interne du serveur lors de la création de la salle.');
    }
  }

  /**
   * Récupère toutes les salles de la base de données.
   * Gère les erreurs de base de données potentielles.
   * Si une erreur se produit, lance une InternalServerErrorException.
   * @returns Une liste de toutes les salles.
   */
  async findAll() {
    try {
      // Récupérer toutes les salles
      return await this.prisma.salle.findMany();
    } catch (error) {
      // Gérer les erreurs de base de données
      throw new InternalServerErrorException('Erreur interne du serveur lors de la récupération des salles.');
    }
  }

  /**
   * Récupère une salle par son ID.
   * Vérifie si la salle existe avant de la retourner.
   * Gère les erreurs de base de données potentielles.
   * Si la salle n'existe pas, lance une NotFoundException.
   * Si une erreur se produit, lance une InternalServerErrorException.
   * @param id L'ID de la salle à récupérer.
   * @returns La salle trouvée ou une NotFoundException si elle n'existe pas.
   */
  async findOne(id: string) {
    try {
      const salle = await this.prisma.salle.findUnique({ where: { id } });
      if (!salle) {
        throw new NotFoundException(`Salle avec l'ID "${id}" introuvable.`);
      }
      return salle;
    } catch (error) {
      // Gérer les erreurs de base de données
      // Si l'erreur est une NotFoundException, la relancer
      // Sinon, lancer une InternalServerErrorException
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Salle avec l'ID "${id}" introuvable.`);
      }
      // Re-lancer les exceptions NestJS que nous avons déjà gérées
      if (error instanceof ConflictException) {
          throw error; // Re-lancer les exceptions de conflit
      }
      // Pour toute autre erreur, lancer une InternalServerErrorException
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la récupération de la salle avec l'ID "${id}".`);
    }
  }

  /**
   * Met à jour une salle par son ID.
   * Vérifie si la salle existe avant de tenter la mise à jour.
   * Vérifie les conflits de nom si le nom est mis à jour.
   * Gère les erreurs de base de données potentielles, y compris les violations de contrainte unique.
   * @param id L'ID de la salle à mettre à jour.
   * Si la salle n'existe pas, lance une NotFoundException.
   * Si le nom est mis à jour et existe déjà, lance une ConflictException.
   * @param updateSalleDto Les données de mise à jour de la salle.
   * Si une erreur se produit, lance une InternalServerErrorException.
   * @returns La salle mise à jour:
   */
  async update(id: string, updateSalleDto: UpdateSalleDto) {
    try {
      // Vérifier si la salle existe avant de tenter la mise à jour
      const existingSalle = await this.prisma.salle.findUnique({ where: { id } });
      if (!existingSalle) {
        throw new NotFoundException(`Salle avec l'ID "${id}" introuvable.`);
      }

      // Vérifier les conflits de nom si le nom est mis à jour
      // Si le nom est mis à jour, vérifier s'il existe déjà une salle avec ce nom
      // et lancer une ConflictException si c'est le cas
      if (updateSalleDto.nom && updateSalleDto.nom !== existingSalle.nom) {
        const nameConflict = await this.prisma.salle.findUnique({
          where: { nom: updateSalleDto.nom },
        });
        if (nameConflict) {
          throw new ConflictException(`Le nom de salle "${updateSalleDto.nom}" est déjà utilisé par une autre salle.`);
        }
      }
      // Mettre à jour la salle avec les données fournies
      return await this.prisma.salle.update({ where: { id }, data: updateSalleDto });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
          throw error; // Re-lancer les exceptions NestJS que nous avons déjà gérées
      }
      // Gérer l'erreur spécifique de Prisma pour les violations de contrainte unique (P2002)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        if (error.meta?.target === 'nom') {
          throw new ConflictException(`Le nom de salle "${updateSalleDto.nom}" est déjà utilisé.`);
        }
      }
      // Pour toute autre erreur, lancer une InternalServerErrorException
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la mise à jour de la salle avec l'ID "${id}".`);
    }
  }

  /**
   * Supprime une salle par son ID.
   * Vérifie si la salle existe avant de tenter la suppression.
   * Gère les erreurs de base de données potentielles, y compris les violations de contrainte de clé étrangère.
   * Si la salle n'existe pas, lance une NotFoundException.
   * Si la salle est liée à d'autres enregistrements (ex: séances), lance une ConflictException.
   * Si une erreur se produit, lance une InternalServerErrorException.
   * @param id L'ID de la salle à supprimer.
   * @returns Un message de succès si la salle est supprimée avec succès.
   */
  async remove(id: string) {
    try {
      // Vérifier si la salle existe avant de tenter la suppression
      const existingSalle = await this.prisma.salle.findUnique({ where: { id } });
      if (!existingSalle) {
        throw new NotFoundException(`Salle avec l'ID "${id}" introuvable.`);
      }

      // Supprimer la salle
      await this.prisma.salle.delete({ where: { id } });
      return { message: 'Salle supprimée avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) {
          throw error;
      }
      // Gérer les erreurs de base de données spécifiques, comme les violations de contrainte de clé étrangère (P2003)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(`Impossible de supprimer la salle avec l'ID "${id}" car elle est liée à d'autres enregistrements (ex: séances).`);
      }
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la suppression de la salle avec l'ID "${id}".`);
    }
  }
}