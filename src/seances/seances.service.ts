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
import { FindSeancesFilterDto } from './dto/find-seances-filter.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Role } from '@prisma/client';

@Injectable()
export class SeancesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée une nouvelle séance après validation des contraintes.
   */
  async create(createSeanceDto: CreateSeanceDto, userId: string) {
    const {
      niveauId,
      enseignantId,
      matiereId,
      salleId,
      date,
      heureDebut,
      heureFin,
      anneeScolaire,
      semestre,
    } = createSeanceDto;

    // Convertir les heures et date en objets Date pour faciliter la comparaison
    const debut = new Date(`${date}T${heureDebut}:00`);
    const fin = new Date(`${date}T${heureFin}:00`);
    const dateObj = new Date(date);

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

      if (creatingUser.role !== Role.ADMIN && creatingUser.enseignant?.id !== enseignantId) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à créer cette séance pour un autre enseignant.");
      }

      // 1. Vérifier l'existence des entités liées
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

      // 4. Vérifier la disponibilité de l'enseignant et de la salle (pour la même date)
      const overlappingSeances = await this.prisma.seance.findMany({
        where: {
          date: dateObj,
          anneeScolaire: anneeScolaire,
          semestre: semestre,
          OR: [
            { enseignantId: enseignantId },
            { salleId: salleId },
          ],
          AND: [
            { heureDebut: { lt: fin } },
            { heureFin: { gt: debut } },
          ],
        },
      });

      for (const seance of overlappingSeances) {
        if (seance.enseignantId === enseignantId) {
          throw new ConflictException(`L'enseignant est déjà occupé de ${seance.heureDebut.toTimeString().substring(0, 5)} à ${seance.heureFin.toTimeString().substring(0, 5)} pour une autre séance à cette date.`);
        }
        if (seance.salleId === salleId) {
          throw new ConflictException(`La salle "${salle.nom}" est déjà occupée de ${seance.heureDebut.toTimeString().substring(0, 5)} à ${seance.heureFin.toTimeString().substring(0, 5)} à cette date.`);
        }
      }

      // Créer la séance
      const nouvelleSeance = await this.prisma.seance.create({
        data: {
          niveauId,
          enseignantId,
          matiereId,
          salleId,
          date: dateObj,
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
   */
  async findAll(filters: FindSeancesFilterDto = {}) {
    const where: any = {};

    if (filters.niveauId) where.niveauId = filters.niveauId;
    if (filters.enseignantId) where.enseignantId = filters.enseignantId;
    if (filters.matiereId) where.matiereId = filters.matiereId;
    if (filters.salleId) where.salleId = filters.salleId;
    if (filters.date) where.date = new Date(filters.date);
    if (filters.anneeScolaire) where.anneeScolaire = filters.anneeScolaire;
    if (filters.semestre) where.semestre = filters.semestre;
    // Pour heureDebut/heureFin, adapter si besoin pour du range

    try {
      return await this.prisma.seance.findMany({
        where,
        include: {
          niveau: { include: { departement: true } },
          enseignant: { include: { utilisateur: true } },
          matiere: { include: { niveau: true } },
          salle: true,
        },
        orderBy: [
          { date: 'asc' },
          { anneeScolaire: 'asc' },
          { semestre: 'asc' },
          { heureDebut: 'asc' },
        ],
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des séances filtrées:', error);
      throw new InternalServerErrorException('Erreur interne du serveur lors de la récupération des séances filtrées.');
    }
  }

  /**
   * Récupère une séance spécifique par son ID, avec ses relations.
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
   */
  async update(id: string, updateSeanceDto: UpdateSeanceDto, userId: string) {
    const {
      niveauId,
      enseignantId,
      matiereId,
      salleId,
      date,
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

      const updatingUser = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
        include: { enseignant: true },
      });

      if (!updatingUser) {
        throw new NotFoundException("Utilisateur connecté introuvable.");
      }

      if (updatingUser.role !== Role.ADMIN && updatingUser.enseignant?.id !== existingSeance.enseignantId) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette séance.");
      }

      // Récupérer les valeurs actuelles si non fournies dans le DTO de mise à jour
      const currentNiveauId = niveauId || existingSeance.niveauId;
      const currentEnseignantId = enseignantId || existingSeance.enseignantId;
      const currentMatiereId = matiereId || existingSeance.matiereId;
      const currentSalleId = salleId || existingSeance.salleId;
      const currentDate = date || existingSeance.date.toISOString().slice(0, 10);
      const currentHeureDebut = heureDebut || existingSeance.heureDebut.toTimeString().substring(0, 5);
      const currentHeureFin = heureFin || existingSeance.heureFin.toTimeString().substring(0, 5);
      const currentAnneeScolaire = anneeScolaire || existingSeance.anneeScolaire;
      const currentSemestre = semestre !== undefined ? semestre : existingSeance.semestre;

      // Convertir date/heure
      const debut = new Date(`${currentDate}T${currentHeureDebut}:00`);
      const fin = new Date(`${currentDate}T${currentHeureFin}:00`);
      const dateObj = new Date(currentDate);

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

      if (matiere.niveauId !== currentNiveauId) {
        throw new BadRequestException(
          `La matière "${matiere.nom}" n'est pas associée au niveau "${niveau.nom}".`,
        );
      }

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

      // 4. Vérifier la disponibilité de l'enseignant et de la salle (en excluant la séance actuelle, même date)
      const overlappingSeances = await this.prisma.seance.findMany({
        where: {
          id: { not: id },
          date: dateObj,
          anneeScolaire: currentAnneeScolaire,
          semestre: currentSemestre,
          OR: [
            { enseignantId: currentEnseignantId },
            { salleId: currentSalleId },
          ],
          AND: [
            { heureDebut: { lt: fin } },
            { heureFin: { gt: debut } },
          ],
        },
      });

      for (const seance of overlappingSeances) {
        if (seance.enseignantId === currentEnseignantId) {
          throw new ConflictException(`L'enseignant est déjà occupé de ${seance.heureDebut.toTimeString().substring(0, 5)} à ${seance.heureFin.toTimeString().substring(0, 5)} pour une autre séance à cette date.`);
        }
        if (seance.salleId === currentSalleId) {
          throw new ConflictException(`La salle "${salle.nom}" est déjà occupée de ${seance.heureDebut.toTimeString().substring(0, 5)} à ${seance.heureFin.toTimeString().substring(0, 5)} à cette date.`);
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
          date: dateObj,
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

      const deletingUser = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
        include: { enseignant: true },
      });

      if (!deletingUser) {
        throw new NotFoundException("Utilisateur connecté introuvable.");
      }

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