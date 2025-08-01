// src/utilisateurs/dto/update-enseignant-profile.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsUUID, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// DTO pour la liaison Matière-Niveau dans le profil enseignant
export class UpdateEnseignantMatiereNiveauDto {
  @ApiPropertyOptional({
    description: "ID de la matière à associer.",
    example: 'uuid-matiere-1',
    format: 'uuid',
  })
  @IsUUID('4', { message: "L'ID de la matière doit être un UUID valide." })
  @IsNotEmpty({ message: "L'ID de la matière est obligatoire." })
  matiereId: string;

  @ApiPropertyOptional({
    description: "ID du niveau associé à la matière (pour validation de cohérence).",
    example: 'uuid-niveau-1',
    format: 'uuid',
  })
  @IsUUID('4', { message: "L'ID du niveau doit être un UUID valide." })
  @IsNotEmpty({ message: "L'ID du niveau est obligatoire." })
  niveauId: string;
}

export class UpdateEnseignantProfileDto {
  @ApiPropertyOptional({
    description: "Le nouveau poste de l'enseignant (peut être null pour le supprimer).",
    example: 'Professeur Principal',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Le poste doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le poste ne peut pas être vide si fourni.' })
  poste?: string | null;

  @ApiPropertyOptional({
    description: "Liste des matières et de leurs niveaux associés que l'enseignant enseigne.",
    type: [UpdateEnseignantMatiereNiveauDto],
    example: [{ matiereId: 'uuid-matiere-1', niveauId: 'uuid-niveau-1' }],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateEnseignantMatiereNiveauDto)
  matieresNiveaux?: UpdateEnseignantMatiereNiveauDto[];
}
