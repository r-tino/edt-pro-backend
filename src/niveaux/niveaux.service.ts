// src/niveaux/niveaux.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException, // Ajouté pour valider les relations
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNiveauDto } from './dto/create-niveau.dto';
import { UpdateNiveauDto } from './dto/update-niveau.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class NiveauxService {
  constructor(private prisma: PrismaService) {}

  async create(createNiveauDto: CreateNiveauDto) {
    const { nom, departementId } = createNiveauDto;
    try {
      // 1. Vérifier si le département existe
      const departement = await this.prisma.departement.findUnique({
        where: { id: departementId },
      });
      if (!departement) {
        throw new NotFoundException(`Cet département n'existe pas.`);
      }

      // 2. Vérifier si un niveau avec le même nom existe déjà dans ce département
      const existingNiveau = await this.prisma.niveau.findFirst({
        where: {
          nom: {
            equals: nom,
            mode: 'insensitive', // Permet de vérifier sans tenir compte de la casse (ex: L1 et l1 seraient considérés comme identiques)
          },
          departementId: departementId,
        },
      });

      if (existingNiveau) {
        throw new ConflictException(`Un niveau '${nom}' existe déjà pour le département '${departement.nom}'.`);
      }

      // 3. Créer le nouveau niveau
      const niveau = await this.prisma.niveau.create({
        data: {
          nom,
          departement: {
            connect: { id: departementId },
          },
        },
        include: { departement: true }, // Inclure les informations du département lié
      });
      return niveau;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Erreur lors de la création du niveau:', error);
      throw new InternalServerErrorException(
        'Une erreur inattendue est survenue lors de la création du niveau.',
      );
    }
  }

  async findAll() {
    try {
      return await this.prisma.niveau.findMany({
        orderBy: [{ nom: 'asc' }],
        include: { // AJOUTÉ : Inclure les comptes des relations
          departement: true,
          _count: {
            select: {
              etudiants: true,
              matieres: true,
              seances: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des niveaux:', error);
      throw new InternalServerErrorException(
        'Impossible de récupérer les niveaux.',
      );
    }
  }

  async findOne(id: string) {
    try {
      const niveau = await this.prisma.niveau.findUnique({
        where: { id },
        include: { // AJOUTÉ : Inclure les comptes des relations
          departement: true,
          _count: {
            select: {
              etudiants: true,
              matieres: true,
              seances: true,
            },
          },
        },
      });
      if (!niveau) {
        throw new NotFoundException(`Cet Niveau est introuvable.`);
      }
      return niveau;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Niveau avec l'ID "${id}" introuvable.`);
      }
      console.error('Erreur lors de la récupération du niveau:', error);
      throw new InternalServerErrorException(
        `Impossible de récupérer le niveau avec l'ID "${id}".`,
      );
    }
  }

  async update(id: string, updateNiveauDto: UpdateNiveauDto) {
    const { nom, departementId } = updateNiveauDto;
    try {
      // 1. Vérifier si le niveau existe
      const existingNiveau = await this.prisma.niveau.findUnique({
        where: { id },
      });
      if (!existingNiveau) {
        throw new NotFoundException(`Cet Niveau est introuvable.`);
      }

      // 2. Si departementId est fourni, vérifier qu'il existe
      if (departementId) {
        const departement = await this.prisma.departement.findUnique({
          where: { id: departementId },
        });
        if (!departement) {
          throw new NotFoundException(`Cet nouveau département n'existe pas.`);
        }
      }

      // 3. Vérifier les conflits de nom de niveau dans le nouveau ou l'ancien département
      const targetDepartementId = departementId || existingNiveau.departementId;
      const targetNom = nom || existingNiveau.nom;

      // Vérifier si un autre niveau (différent de celui qu'on met à jour) a déjà ce nom dans ce département
      const nameConflict = await this.prisma.niveau.findFirst({
        where: {
          nom: {
            equals: targetNom,
            mode: 'insensitive',
          },
          departementId: targetDepartementId,
          NOT: {
            id: id, // Exclure le niveau actuel de la vérification de conflit
          },
        },
      });

      if (nameConflict) {
        const conflictingDepartement = await this.prisma.departement.findUnique({
          where: { id: targetDepartementId }
        });
        throw new ConflictException(
          `Un niveau '${targetNom}' existe déjà pour le département '${conflictingDepartement?.nom || targetDepartementId}'.`,
        );
      }

      const updatedNiveau = await this.prisma.niveau.update({
        where: { id },
        data: {
          nom: nom,
          departement: departementId ? { connect: { id: departementId } } : undefined,
        },
        include: { departement: true }, // Inclure les infos du département dans la réponse
      });
      return updatedNiveau;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Erreur lors de la mise à jour du niveau:', error);
      throw new InternalServerErrorException(
        `Impossible de mettre à jour cet niveau.`
      );
    }
  }

  async remove(id: string) {
    try {
      // 1. Vérifier si le niveau existe
      const existingNiveau = await this.prisma.niveau.findUnique({
        where: { id },
      });
      if (!existingNiveau) {
        throw new NotFoundException(`Cet Niveau est introuvable.`);
      }

      // 2. Vérifier s'il y a des étudiants associés à ce niveau
      const etudiantsAssocies = await this.prisma.etudiant.count({
        where: { niveauId: id },
      });
      const matieresAssociees = await this.prisma.matiere.count({
        where: { niveauId: id },
      });
      const seancesAssociees = await this.prisma.seance.count({
        where: { niveauId: id },
      });

      if (etudiantsAssocies > 0) {
        throw new ConflictException(
          `Le niveau '${existingNiveau.nom}' ne peut pas être supprimé car il a ${etudiantsAssocies} étudiant(s) associé(s).`,
        );
      }
      if (matieresAssociees > 0) {
        throw new ConflictException(
          `Le niveau '${existingNiveau.nom}' ne peut pas être supprimé car il a ${matieresAssociees} matière(s) associée(s).`,
        );
      }
      if (seancesAssociees > 0) {
        throw new ConflictException(
          `Le niveau '${existingNiveau.nom}' ne peut pas être supprimé car il a ${seancesAssociees} séance(s) associée(s).`,
        );
      }


      await this.prisma.niveau.delete({
        where: { id },
      });
      return { message: 'Niveau supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      console.error('Erreur lors de la suppression du niveau:', error);
      throw new InternalServerErrorException(
        `Impossible de supprimer cet niveau.`,
      );
    }
  }
}
