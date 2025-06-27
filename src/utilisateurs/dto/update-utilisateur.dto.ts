// src/utilisateurs/dto/update-utilisateur.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUtilisateurDto } from './create-utilisateur.dto';
import { IsOptional, IsString, MinLength } from 'class-validator'; // Importer IsOptional, IsString, MinLength

export class UpdateUtilisateurDto extends PartialType(CreateUtilisateurDto) {
  @IsOptional() // Déjà implicite par PartialType, mais clarifie l'intention
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  motDePasse?: string; // Le rendre optionnel avec le ?
}