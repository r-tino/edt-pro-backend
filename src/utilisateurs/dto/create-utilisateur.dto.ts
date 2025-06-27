// src/utilisateurs/dto/create-utilisateur.dto.ts
import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUtilisateurDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide.' })
  nom: string;
  
  @IsEmail({}, { message: 'L\'adresse email n\'est pas valide.' })
  @IsNotEmpty({ message: 'L\'email ne peut pas être vide.' })
  email: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le mot de passe ne peut pas être vide.' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  motDePasse: string;

  @IsEnum(Role, { message: 'Le rôle doit être ADMIN, ENSEIGNANT ou ETUDIANT.' })
  @IsNotEmpty({ message: 'Le rôle ne peut pas être vide.' })
  role: Role;
}