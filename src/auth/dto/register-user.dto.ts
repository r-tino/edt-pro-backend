// src/auth/dto/register-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsEnum,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client'; // Assurez-vous que le chemin est correct pour l'énumération Role
import { RegisterEnseignantProfileDto } from './register-enseignant-profile.dto';
import { RegisterEtudiantProfileDto } from './register-etudiant-profile.dto';
// import { RegisterSurveillantProfileDto } from './register-surveillant-profile.dto'; // Cette ligne sera supprimée si elle existe

export class RegisterUserDto {
  @ApiProperty({ description: 'Nom complet de l\'utilisateur', example: 'Jean Dupont' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide.' })
  nom: string;

  @ApiProperty({ description: 'Adresse email de l\'utilisateur (unique)', example: 'jean.dupont@example.com' })
  @IsEmail({}, { message: 'L\'email doit être une adresse email valide.' })
  @IsNotEmpty({ message: 'L\'email ne peut pas être vide.' })
  email: string;

  @ApiProperty({ description: 'Mot de passe de l\'utilisateur (minimum 8 caractères)', example: 'MotDePasse123!' })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le mot de passe ne peut pas être vide.' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  motDePasse: string;

  @ApiProperty({
    enum: Role,
    description: 'Rôle de l\'utilisateur. ADMIN ne peut pas être choisi lors de l\'inscription.',
    example: Role.ETUDIANT,
    enumName: 'Role'
  })
  @IsEnum(Role, { message: 'Le rôle spécifié est invalide.' })
  @IsNotEmpty({ message: 'Le rôle ne peut pas être vide.' })
  role: Role;

  @ApiProperty({
    type: RegisterEnseignantProfileDto,
    description: 'Informations spécifiques pour le profil Enseignant, si le rôle est ENSEIGNANT.',
    required: false,
  })
  @ValidateIf(o => o.role === Role.ENSEIGNANT)
  @ValidateNested()
  @Type(() => RegisterEnseignantProfileDto)
  enseignantProfile?: RegisterEnseignantProfileDto;

  @ApiProperty({
    type: RegisterEtudiantProfileDto,
    description: 'Informations spécifiques pour le profil Etudiant, si le rôle est ETUDIANT.',
    required: false,
  })
  @ValidateIf(o => o.role === Role.ETUDIANT)
  @ValidateNested()
  @Type(() => RegisterEtudiantProfileDto)
  etudiantProfile?: RegisterEtudiantProfileDto;
}