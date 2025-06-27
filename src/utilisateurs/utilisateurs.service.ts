// src/utilisateurs/utilisateurs.service.ts
import {
  Injectable,
  NotFoundException, // Importer pour les erreurs 404
  ConflictException,  // Importer pour les erreurs 409 (conflit de ressources)
  InternalServerErrorException // Importer pour les erreurs 500
} from '@nestjs/common';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { PrismaService } from '../prisma/prisma.service'; // Importer le PrismaService
import * as bcrypt from 'bcrypt'; // Importer bcrypt pour le hachage du mot de passe

@Injectable()
export class UtilisateursService {
  constructor(private prisma: PrismaService) {}

  async create(createUtilisateurDto: CreateUtilisateurDto) {
    try {
      // 1. Hasher le mot de passe avant de le stocker
      const hashedPassword = await bcrypt.hash(createUtilisateurDto.motDePasse, 10); // 10 est le "saltRounds"

      // 2. Vérifier si un utilisateur avec cet email existe déjà
      const existingUser = await this.prisma.utilisateur.findUnique({
        where: { email: createUtilisateurDto.email },
      });

      if (existingUser) {
        throw new ConflictException(`Un utilisateur avec l'email "${createUtilisateurDto.email}" existe déjà.`);
      }

      // 3. Créer l'utilisateur dans la base de données
      const utilisateur = await this.prisma.utilisateur.create({
        data: {
          nom: createUtilisateurDto.nom,
          email: createUtilisateurDto.email,
          motDePasse: hashedPassword, // Stocker le mot de passe haché
          role: createUtilisateurDto.role,
        },
        select: { // Sélectionner les champs à retourner (exclure le mot de passe)
          id: true,
          nom: true,
          email: true,
          role: true,
          createdAt: true,
        }
      });
      return utilisateur;
    } catch (error) {
      // Gérer les erreurs spécifiques de Prisma (ex: P2002 pour un champ unique déjà existant)
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ConflictException(`L'email "${createUtilisateurDto.email}" est déjà utilisé.`);
      }
      // Re-lancer les exceptions NestJS déjà gérées
      if (error instanceof ConflictException) {
        throw error;
      }
      // Gérer toute autre erreur inattendue
      throw new InternalServerErrorException('Une erreur inattendue est survenue lors de la création de l\'utilisateur.');
    }
  }

  async findAll() {
    try {
      return this.prisma.utilisateur.findMany({
        select: {
          id: true, nom: true, email: true, role: true, createdAt: true,
        }
      });
    } catch (error) {
      throw new InternalServerErrorException('Impossible de récupérer les utilisateurs.');
    }
  }

  async findOne(id: string) {
    try {
      const utilisateur = await this.prisma.utilisateur.findUnique({
        where: { id },
        select: {
          id: true, nom: true, email: true, role: true, createdAt: true,
        }
      });
      if (!utilisateur) {
        throw new NotFoundException(`Utilisateur avec l'ID "${id}" introuvable.`);
      }
      return utilisateur;
    } catch (error) {
      // Si l'erreur est déjà une NestJS exception, la relancer directement
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Impossible de récupérer l'utilisateur avec l'ID "${id}".`);
    }
  }

  async update(id: string, updateUtilisateurDto: UpdateUtilisateurDto) {
    try {
      // Vérifier si l'utilisateur existe avant de tenter la mise à jour
      const existingUser = await this.prisma.utilisateur.findUnique({ where: { id } });
      if (!existingUser) {
        throw new NotFoundException(`Utilisateur avec l'ID "${id}" introuvable.`);
      }

      // Gérer le hachage du mot de passe si le champ est présent dans le DTO
      if (updateUtilisateurDto.motDePasse) {
        updateUtilisateurDto.motDePasse = await bcrypt.hash(updateUtilisateurDto.motDePasse, 10);
      }
      
      // Vérifier si l'email mis à jour existe déjà (s'il est modifié et différent de l'actuel)
      if (updateUtilisateurDto.email && updateUtilisateurDto.email !== existingUser.email) {
          const emailConflict = await this.prisma.utilisateur.findUnique({
              where: { email: updateUtilisateurDto.email },
          });
          if (emailConflict) {
              throw new ConflictException(`L'email "${updateUtilisateurDto.email}" est déjà utilisé par un autre utilisateur.`);
          }
      }

      const utilisateur = await this.prisma.utilisateur.update({
        where: { id },
        data: updateUtilisateurDto,
        select: {
          id: true, nom: true, email: true, role: true, createdAt: true,
        }
      });
      return utilisateur;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      // Gérer les erreurs de validation Prisma ou outers erreurs inattendues
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ConflictException(`L'email "${updateUtilisateurDto.email}" est déjà utilisé.`);
      }
      throw new InternalServerErrorException(`Impossible de mettre à jour l'utilisateur avec l'ID "${id}".`);
    }
  }

  async remove(id: string) {
    try {
      // Vérifier si l'utilisateur existe avant de tenter la suppression
      const existingUser = await this.prisma.utilisateur.findUnique({ where: { id } });
      if (!existingUser) {
        throw new NotFoundException(`Utilisateur avec l'ID "${id}" introuvable.`);
      }

      await this.prisma.utilisateur.delete({
        where: { id },
      });
      return { message: 'Utilisateur supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Impossible de supprimer l'utilisateur avec l'ID "${id}".`);
    }
  }
}