// src/seances/seances.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSeanceDto } from './dto/create-seance.dto';
import { UpdateSeanceDto } from './dto/update-seance.dto';
import { FindSeancesFilterDto } from './dto/find-seances-filter.dto'; // Importez le nouveau DTO
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Role, Jour } from '@prisma/client';

@Injectable()
export class SeancesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée une nouvelle séance après validation des contraintes.
   * (Pas de changement par rapport à la version précédente)
   */
  async create(createSeanceDto: CreateSeanceDto, userId: string) {
    const {
      niveauId,
      enseignantId,
      matiereId,
      salleId,
      jour,
      heureDebut,
      heureFin,
      anneeScolaire,
      semestre,
    } = createSeanceDto;

    // Convertir les heures en objets Date pour faciliter la comparaison
    const debut = new Date(`1970-01-01T${heureDebut}:00`);
    const fin = new Date(`1970-01-01T${heureFin}:00`);

    if (debut >= fin) {
      throw new BadRequestException("L'heure de début doit être antérieure à l'heure de fin.");
    }

    try {
      // 0. Vérifier l'utilisateur qui crée la séance (doit être un ADMIN ou l'ENSEIGNANT concerné)
      const creatingUser = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
        include: { enseignant: true },
      });

      if (!creatingUser) {
        throw new NotFoundException("Utilisateur connecté introuvable.");
      }

      // Seuls les ADMINs ou l'ENSEIGNANT qui donne la séance peuvent la créer
      if (creatingUser.role !== Role.ADMIN && creatingUser.enseignant?.id !== enseignantId) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à créer cette séance pour un autre enseignant.");
      }


      // 1. Vérifier l'existence des entités liées (Niveau, Enseignant, Matiere, Salle)
      const [niveau, enseignant, matiere, salle] = await Promise.all([
        this.prisma.niveau.findUnique({ where: { id: niveauId } }),
        this.prisma.enseignant.findUnique({ where: { id: enseignantId } }),
        this.prisma.matiere.findUnique({ where: { id: matiereId } }),
        this.prisma.salle.findUnique({ where: { id: salleId } }),
      ]);

      if (!niveau) throw new NotFoundException(`Niveau avec l'ID "${niveauId}" introuvable.`);
      if (!enseignant) throw new NotFoundException(`Enseignant avec l'ID "${enseignantId}" introuvable.`);
      if (!matiere) throw new NotFoundException(`Matière avec l'ID "${matiereId}" introuvable.`);
      if (!salle) throw new NotFoundException(`Salle avec l'ID "${salleId}" introuvable.`);

      // 2. Vérifier la cohérence matière/niveau
      if (matiere.niveauId !== niveauId) {
        throw new BadRequestException(
          `La matière "${matiere.nom}" n'est pas associée au niveau "${niveau.nom}".`,
        );
      }

      // 3. Vérifier que la matière fait partie des matières que l'enseignant est autorisé à enseigner
      const enseignantMatiere = await this.prisma.enseignantMatiere.findUnique({
        where: {
          enseignantId_matiereId: {
            enseignantId: enseignantId,
            matiereId: matiereId,
          },
        },
      });
      if (!enseignantMatiere) {
        throw new BadRequestException(
          `L'enseignant n'est pas autorisé à enseigner la matière "${matiere.nom}". Veuillez l'ajouter à ses matières enseignées.`,
        );
      }


      // 4. Vérifier la disponibilité de l'enseignant et de la salle
      const overlappingSeances = await this.prisma.seance.findMany({
        where: {
          jour: jour,
          anneeScolaire: anneeScolaire,
          semestre: semestre, // Inclure le semestre dans la vérification de chevauchement
          OR: [
            // Vérifier le chevauchement pour l'enseignant OU la salle
            { enseignantId: enseignantId },
            { salleId: salleId },
          ],
          // Condition de chevauchement des horaires
          AND: [
            {
              heureDebut: { lt: fin }, // La séance existante commence avant la fin de la nouvelle
            },
            {
              heureFin: { gt: debut }, // La séance existante se termine après le début de la nouvelle
            },
          ],
        },
      });

      // Vérifier chaque chevauchement trouvé
      for (const seance of overlappingSeances) {
        if (seance.enseignantId === enseignantId) {
          throw new ConflictException(`L'enseignant est déjà occupé de ${seance.heureDebut.toTimeString().substring(0, 5)} à ${seance.heureFin.toTimeString().substring(0, 5)} pour une autre séance ce ${jour}.`);
        }
        if (seance.salleId === salleId) {
          throw new ConflictException(`La salle "${salle.nom}" est déjà occupée de ${seance.heureDebut.toTimeString().substring(0, 5)} à ${seance.heureFin.toTimeString().substring(0, 5)} ce ${jour}.`);
        }
      }

      // Créer la séance
      const nouvelleSeance = await this.prisma.seance.create({
        data: {
          niveauId,
          enseignantId,
          matiereId,
          salleId,
          jour,
          heureDebut: debut,
          heureFin: fin,
          anneeScolaire,
          semestre: semestre || null,
        },
        include: {
          niveau: { select: { nom: true } },
          enseignant: { select: { utilisateur: { select: { nom: true } } } },
          matiere: { select: { nom: true } },
          salle: { select: { nom: true } },
        },
      });

      return nouvelleSeance;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        // Gérer d'autres erreurs Prisma si nécessaire
        console.error('Erreur Prisma lors de la création de la séance:', error);
      }
      console.error('Erreur inattendue lors de la création de la séance:', error);
      throw new InternalServerErrorException(
        'Une erreur interne du serveur est survenue lors de la création de la séance.',
      );
    }
  }

  /**
   * Récupère toutes les séances avec leurs relations complètes, avec possibilité de filtrage.
   * @param filters Les critères de filtrage optionnels.
   * @returns Une liste de toutes les séances filtrées.
   */
  async findAll(filters: FindSeancesFilterDto = {}) {
    const where: any = {};

    // Construire la clause 'where' dynamiquement à partir des filtres
    if (filters.niveauId) {
      where.niveauId = filters.niveauId;
    }
    if (filters.enseignantId) {
      where.enseignantId = filters.enseignantId;
    }
    if (filters.matiereId) {
      where.matiereId = filters.matiereId;
    }
    if (filters.salleId) {
      where.salleId = filters.salleId;
    }
    if (filters.jour) {
      where.jour = filters.jour;
    }
    if (filters.anneeScolaire) {
      where.anneeScolaire = filters.anneeScolaire;
    }
    if (filters.semestre) {
      where.semestre = filters.semestre;
    }

    // Gestion des filtres d'heure de début/fin (facultatif et plus complexe)
    // Pour des recherches exactes à l'heure près, il faudrait convertir en Date
    // et utiliser gte/lte. Pour l'instant, on se base sur les IDs et le jour.
    // Si besoin de filtrer par "séances qui commencent après X heure" ou "finissent avant Y heure",
    // il faudrait ajouter des logiques de comparaison de Date objects ici.

    try {
      return await this.prisma.seance.findMany({
        where, // Applique les filtres
        include: {
          niveau: { include: { departement: true } },
          enseignant: { include: { utilisateur: true } },
          matiere: { include: { niveau: true } },
          salle: true,
        },
        orderBy: [{ anneeScolaire: 'asc' }, { semestre: 'asc' }, { jour: 'asc' }, { heureDebut: 'asc' }], // Meilleur ordre de tri pour un emploi du temps
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des séances filtrées:', error);
      throw new InternalServerErrorException('Erreur interne du serveur lors de la récupération des séances filtrées.');
    }
  }

  /**
   * Récupère une séance spécifique par son ID, avec ses relations.
   * (Pas de changement par rapport à la version précédente)
   */
  async findOne(id: string) {
    try {
      const seance = await this.prisma.seance.findUnique({
        where: { id },
        include: {
          niveau: { include: { departement: true } },
          enseignant: { include: { utilisateur: true } },
          matiere: { include: { niveau: true } },
          salle: true,
        },
      });
      if (!seance) {
        throw new NotFoundException(`Séance avec l'ID "${id}" introuvable.`);
      }
      return seance;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Séance avec l'ID "${id}" introuvable.`);
      }
      console.error('Erreur lors de la récupération de la séance:', error);
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la récupération de la séance avec l'ID "${id}".`);
    }
  }

  /**
   * Met à jour une séance existante.
   * (Pas de changement par rapport à la version précédente)
   */
  async update(id: string, updateSeanceDto: UpdateSeanceDto, userId: string) {
    const {
      niveauId,
      enseignantId,
      matiereId,
      salleId,
      jour,
      heureDebut,
      heureFin,
      anneeScolaire,
      semestre,
    } = updateSeanceDto;

    try {
      const existingSeance = await this.prisma.seance.findUnique({
        where: { id },
        include: { enseignant: { include: { utilisateur: true } } },
      });
      if (!existingSeance) {
        throw new NotFoundException(`Séance avec l'ID "${id}" introuvable.`);
      }

      // Vérifier l'utilisateur qui tente de modifier la séance
      const updatingUser = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
        include: { enseignant: true },
      });

      if (!updatingUser) {
        throw new NotFoundException("Utilisateur connecté introuvable.");
      }

      // Seuls les ADMINs ou l'ENSEIGNANT responsable de la séance peuvent la modifier
      if (updatingUser.role !== Role.ADMIN && updatingUser.enseignant?.id !== existingSeance.enseignantId) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette séance.");
      }


      // Récupérer les valeurs actuelles si non fournies dans le DTO de mise à jour
      const currentNiveauId = niveauId || existingSeance.niveauId;
      const currentEnseignantId = enseignantId || existingSeance.enseignantId;
      const currentMatiereId = matiereId || existingSeance.matiereId;
      const currentSalleId = salleId || existingSeance.salleId;
      const currentJour = jour || existingSeance.jour;
      // Convertir les Date objects en string HH:MM pour la comparaison si heureDebut/Fin ne sont pas fournies
      const currentHeureDebut = heureDebut || existingSeance.heureDebut.toTimeString().substring(0, 5);
      const currentHeureFin = heureFin || existingSeance.heureFin.toTimeString().substring(0, 5);
      const currentAnneeScolaire = anneeScolaire || existingSeance.anneeScolaire;
      const currentSemestre = semestre !== undefined ? semestre : existingSeance.semestre;


      // Convertir les heures en objets Date pour la comparaison
      const debut = new Date(`1970-01-01T${currentHeureDebut}:00`);
      const fin = new Date(`1970-01-01T${currentHeureFin}:00`);

      if (debut >= fin) {
        throw new BadRequestException("L'heure de début doit être antérieure à l'heure de fin.");
      }

      // 1. Vérifier l'existence des entités liées (si elles sont modifiées ou si elles n'ont pas été vérifiées à la création)
      const [niveau, enseignant, matiere, salle] = await Promise.all([
        this.prisma.niveau.findUnique({ where: { id: currentNiveauId } }),
        this.prisma.enseignant.findUnique({ where: { id: currentEnseignantId } }),
        this.prisma.matiere.findUnique({ where: { id: currentMatiereId } }),
        this.prisma.salle.findUnique({ where: { id: currentSalleId } }),
      ]);

      if (!niveau) throw new NotFoundException(`Niveau avec l'ID "${currentNiveauId}" introuvable.`);
      if (!enseignant) throw new NotFoundException(`Enseignant avec l'ID "${currentEnseignantId}" introuvable.`);
      if (!matiere) throw new NotFoundException(`Matière avec l'ID "${currentMatiereId}" introuvable.`);
      if (!salle) throw new NotFoundException(`Salle avec l'ID "${currentSalleId}" introuvable.`);

      // 2. Vérifier la cohérence matière/niveau
      if (matiere.niveauId !== currentNiveauId) {
        throw new BadRequestException(
          `La matière "${matiere.nom}" n'est pas associée au niveau "${niveau.nom}".`,
        );
      }

      // 3. Vérifier que la matière fait partie des matières que l'enseignant est autorisé à enseigner
      const enseignantMatiere = await this.prisma.enseignantMatiere.findUnique({
        where: {
          enseignantId_matiereId: {
            enseignantId: currentEnseignantId,
            matiereId: currentMatiereId,
          },
        },
      });
      if (!enseignantMatiere) {
        throw new BadRequestException(
          `L'enseignant n'est pas autorisé à enseigner la matière "${matiere.nom}". Veuillez l'ajouter à ses matières enseignées.`,
        );
      }

      // 4. Vérifier la disponibilité de l'enseignant et de la salle (en excluant la séance actuelle)
      const overlappingSeances = await this.prisma.seance.findMany({
        where: {
          id: { not: id }, // Exclure la séance que nous sommes en train de modifier
          jour: currentJour,
          anneeScolaire: currentAnneeScolaire,
          semestre: currentSemestre,
          OR: [
            { enseignantId: currentEnseignantId },
            { salleId: currentSalleId },
          ],
          AND: [
            {
              heureDebut: { lt: fin },
            },
            {
              heureFin: { gt: debut },
            },
          ],
        },
      });

      for (const seance of overlappingSeances) {
        if (seance.enseignantId === currentEnseignantId) {
          throw new ConflictException(`L'enseignant est déjà occupé de ${seance.heureDebut.toTimeString().substring(0, 5)} à ${seance.heureFin.toTimeString().substring(0, 5)} pour une autre séance ce ${currentJour}.`);
        }
        if (seance.salleId === currentSalleId) {
          throw new ConflictException(`La salle "${salle.nom}" est déjà occupée de ${seance.heureDebut.toTimeString().substring(0, 5)} à ${seance.heureFin.toTimeString().substring(0, 5)} ce ${currentJour}.`);
        }
      }

      // Mettre à jour la séance
      const updatedSeance = await this.prisma.seance.update({
        where: { id },
        data: {
          niveauId: currentNiveauId,
          enseignantId: currentEnseignantId,
          matiereId: currentMatiereId,
          salleId: currentSalleId,
          jour: currentJour,
          heureDebut: debut,
          heureFin: fin,
          anneeScolaire: currentAnneeScolaire,
          semestre: currentSemestre,
        },
        include: {
          niveau: { select: { nom: true } },
          enseignant: { select: { utilisateur: { select: { nom: true } } } },
          matiere: { select: { nom: true } },
          salle: { select: { nom: true } },
        },
      });
      return updatedSeance;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        console.error('Erreur Prisma lors de la mise à jour de la séance:', error);
      }
      console.error('Erreur inattendue lors de la mise à jour de la séance:', error);
      throw new InternalServerErrorException(
        'Une erreur interne du serveur est survenue lors de la mise à jour de la séance.',
      );
    }
  }

  /**
   * Supprime une séance par son ID.
   * (Pas de changement par rapport à la version précédente)
   */
  async remove(id: string, userId: string) {
    try {
      const existingSeance = await this.prisma.seance.findUnique({
        where: { id },
        include: { enseignant: { include: { utilisateur: true } } },
      });
      if (!existingSeance) {
        throw new NotFoundException(`Séance avec l'ID "${id}" introuvable.`);
      }

      // Vérifier l'utilisateur qui tente de supprimer la séance
      const deletingUser = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
        include: { enseignant: true },
      });

      if (!deletingUser) {
        throw new NotFoundException("Utilisateur connecté introuvable.");
      }

      // Seuls les ADMINs ou l'ENSEIGNANT responsable de la séance peuvent la supprimer
      if (deletingUser.role !== Role.ADMIN && deletingUser.enseignant?.id !== existingSeance.enseignantId) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer cette séance.");
      }

      await this.prisma.seance.delete({ where: { id } });
      return { message: 'Séance supprimée avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(`Impossible de supprimer la séance avec l'ID "${id}" car elle est liée à d'autres enregistrements.`);
      }
      console.error('Erreur lors de la suppression de la séance:', error);
      throw new InternalServerErrorException(`Erreur interne du serveur lors de la suppression de la séance.`);
    }
  }
}