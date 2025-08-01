// src/utilisateurs/dto/update-utilisateur.dto.ts
import { IsOptional, IsString, IsEmail, MinLength, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer'; // Importez Type pour @Type
import { Role } from '@prisma/client'; // Importez l'énumération Role
import { ApiPropertyOptional } from '@nestjs/swagger'; // Pour la documentation Swagger

// Importez les DTOs de profil de mise à jour
import { UpdateEtudiantProfileDto } from './update-etudiant-profile.dto';
import { UpdateEnseignantProfileDto } from './update-enseignant-profile.dto';

// Ce DTO gère la mise à jour des informations de base de l'utilisateur
// et de ses profils spécifiques (étudiant, enseignant).
export class UpdateUtilisateurDto {
  @ApiPropertyOptional({ description: "Le nouveau nom de l'utilisateur.", example: 'Jean Nouveau' })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  nom?: string;

  @ApiPropertyOptional({ description: "La nouvelle adresse email de l'utilisateur.", example: 'nouveau.email@example.com' })
  @IsOptional()
  @IsEmail({}, { message: "L'email n'est pas valide." })
  email?: string;

  @ApiPropertyOptional({ description: "Le nouveau mot de passe de l'utilisateur (minimum 8 caractères). Laisser vide pour ne pas changer.", example: 'nouveauPass123' })
  @IsOptional()
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  motDePasse?: string;

  @ApiPropertyOptional({ description: "Le nouveau rôle de l'utilisateur.", enum: Role, example: Role.ENSEIGNANT })
  @IsOptional()
  @IsEnum(Role, { message: 'Le rôle doit être ADMIN, ENSEIGNANT ou ETUDIANT.' })
  role?: Role;

  @ApiPropertyOptional({ description: "Les informations de profil de l'étudiant si le rôle est ETUDIANT.", type: UpdateEtudiantProfileDto })
  @IsOptional()
  @ValidateNested() // Permet la validation des objets imbriqués
  @Type(() => UpdateEtudiantProfileDto) // Indique le type de l'objet imbriqué pour la transformation
  etudiantProfile?: UpdateEtudiantProfileDto;

  @ApiPropertyOptional({ description: "Les informations de profil de l'enseignant si le rôle est ENSEIGNANT.", type: UpdateEnseignantProfileDto })
  @IsOptional()
  @ValidateNested() // Permet la validation des objets imbriqués
  @Type(() => UpdateEnseignantProfileDto) // Indique le type de l'objet imbriqué pour la transformation
  enseignantProfile?: UpdateEnseignantProfileDto;
}
