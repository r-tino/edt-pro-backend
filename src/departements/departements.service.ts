// src/departements/departements.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';

@Injectable()
export class DepartementsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartementDto: CreateDepartementDto) {
    try {
      // Vérifier si un département avec le même nom existe déjà
      const existingDepartement = await this.prisma.departement.findUnique({
        where: { nom: createDepartementDto.nom },
      });

      if (existingDepartement) {
        throw new ConflictException(
          `Le département '${createDepartementDto.nom}' existe déjà.`,
        );
      }

      // Créer le nouveau département
      const departement = await this.prisma.departement.create({
        data: {
          nom: createDepartementDto.nom,
        },
      });
      return departement;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      // Gérer l'erreur spécifique de Prisma pour les contraintes uniques (P2002)
      if (error.code === 'P2002' && error.meta?.target?.includes('nom')) {
        throw new ConflictException(
          `Le département '${createDepartementDto.nom}' existe déjà.`,
        );
      }
      console.error('Erreur lors de la création du département:', error);
      throw new InternalServerErrorException(
        'Une erreur inattendue est survenue lors de la création du département.',
      );
    }
  }

  async findAll() {
    try {
      // MODIFICATION ICI : Inclure le _count des relations niveaux et enseignants
      return await this.prisma.departement.findMany({
        orderBy: { nom: 'asc' }, // Trier par nom
        include: {
          _count: {
            select: {
              niveaux: true, // Inclure le compte des niveaux associés
              // enseignants: true, // Inclure le compte des enseignants associés (relation inexistante dans le modèle Prisma)
            },
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des départements:', error);
      throw new InternalServerErrorException(
        'Impossible de récupérer les départements.',
      );
    }
  }

  async findOne(id: string) {
    try {
      const departement = await this.prisma.departement.findUnique({
        where: { id },
      });
      if (!departement) {
        throw new NotFoundException(` Cet Département est introuvable.`);
      }
      return departement;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erreur lors de la récupération du département:', error);
      throw new InternalServerErrorException(
        `Impossible de récupérer cet département.`,
      );
    }
  }

  async update(id: string, updateDepartementDto: UpdateDepartementDto) {
    try {
      // Vérifier si le département existe
      const existingDepartement = await this.prisma.departement.findUnique({
        where: { id },
      });
      if (!existingDepartement) {
        throw new NotFoundException(` Cet Département est introuvable.`);
      }

      // Vérifier si le nouveau nom est déjà pris par un autre département
      if (updateDepartementDto.nom && updateDepartementDto.nom !== existingDepartement.nom) {
        const nameConflict = await this.prisma.departement.findUnique({
          where: { nom: updateDepartementDto.nom },
        });
        if (nameConflict) {
          throw new ConflictException(
            `Le nom de département '${updateDepartementDto.nom}' est déjà utilisé.`,
          );
        }
      }

      const updatedDepartement = await this.prisma.departement.update({
        where: { id },
        data: updateDepartementDto,
      });
      return updatedDepartement;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      // Gérer l'erreur spécifique de Prisma pour les contraintes uniques
      if (error.code === 'P2002' && error.meta?.target?.includes('nom')) {
        throw new ConflictException(
          `Le nom de département '${updateDepartementDto.nom}' est déjà utilisé.`,
        );
      }
      console.error('Erreur lors de la mise à jour du département:', error);
      throw new InternalServerErrorException(
        `Impossible de mettre à jour cet département.`,
      );
    }
  }

  async remove(id: string) {
    try {
      // Vérifier si le département existe
      const existingDepartement = await this.prisma.departement.findUnique({
        where: { id },
      });
      if (!existingDepartement) {
        throw new NotFoundException(` Cet Département est introuvable.`);
      }

      // Optionnel: Vérifier s'il y a des niveaux liés avant de supprimer un département
      // Cette logique est commentée ici pour ne pas modifier votre comportement actuel.
      // Si vous voulez empêcher la suppression si des niveaux sont associés, décommentez ceci.
      // const niveauxAssocies = await this.prisma.niveau.count({
      //   where: { departementId: id },
      // });
      // if (niveauxAssocies > 0) {
      //   throw new ConflictException(
      //     `Le département "${existingDepartement.nom}" ne peut pas être supprimé car il a des niveaux associés.`,
      //   );
      // }

      await this.prisma.departement.delete({
        where: { id },
      });
      return { message: 'Département supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      console.error('Erreur lors de la suppression du département:', error);
      throw new InternalServerErrorException(
        `Impossible de supprimer cet département.`,
      );
    }
  }
}