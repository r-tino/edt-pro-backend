// src/etudiants/dto/update-etudiant.dto.ts
import { IsUUID, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Le DTO de mise à jour ne doit pas hériter de CreateEtudiantDto
// car CreateEtudiantDto est supprimé et n'est plus pertinent pour la mise à jour.
export class UpdateEtudiantDto {
  @ApiPropertyOptional({
    description: "Le nouveau numéro de matricule de l'étudiant.",
    example: 'ETU2025002',
  })
  @IsOptional()
  @IsString({ message: 'Le matricule doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le matricule ne peut pas être vide si fourni.' })
  matricule?: string;

  @ApiPropertyOptional({
    description: "Le nouvel ID du niveau si l'étudiant change de niveau.",
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Le niveauId doit être un UUID valide.' })
  niveauId?: string;

  // L'utilisateurId n'est pas inclus ici car il ne doit pas être modifiable via cette route PATCH.
}
