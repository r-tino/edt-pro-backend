// src/utilisateurs/dto/update-etudiant-profile.dto.ts
import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEtudiantProfileDto {
  @ApiPropertyOptional({
    description: "Le nouveau numéro de matricule de l'étudiant (peut être null pour le supprimer).",
    example: 'ETU2025002',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Le matricule doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le matricule ne peut pas être vide si fourni.' })
  matricule?: string | null;

  @ApiPropertyOptional({
    description: "Le nouvel ID du niveau si l'étudiant change de niveau.",
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Le niveauId doit être un UUID valide.' })
  niveauId?: string;
}
