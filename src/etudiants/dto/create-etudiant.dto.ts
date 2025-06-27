// src/etudiants/dto/create-etudiant.dto.ts
import { IsUUID, IsString, IsOptional, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateEtudiantDto {
  @ApiProperty({
    description: "L'ID de l'utilisateur associé à cet étudiant. Cet utilisateur doit exister et avoir le rôle 'ETUDIANT'.",
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    format: 'uuid',
  })
  @IsUUID('4', { message: "L'utilisateurId doit être un UUID valide." })
  @IsNotEmpty({ message: "L'utilisateurId ne peut pas être vide." })
  utilisateurId: string;

  @ApiProperty({
    description: "L'ID du niveau auquel cet étudiant est inscrit (ex: L1 Droit).",
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Le niveauId doit être un UUID valide.' })
  @IsNotEmpty({ message: 'Le niveauId est obligatoire.' })
  niveauId: string;

  @ApiProperty({
    description: "Le numéro de matricule de l'étudiant (peut être généré automatiquement ou fourni).",
    example: 'ETU2025001',
    required: false, // Rendre ce champ facultatif lors de la création
  })
  @IsOptional()
  @IsString({ message: 'Le matricule doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le matricule ne peut pas être vide si fourni.' })
  matricule?: string;
}