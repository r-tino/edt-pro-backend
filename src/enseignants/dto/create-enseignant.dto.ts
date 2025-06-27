// src/enseignants/dto/create-enseignant.dto.ts
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Optionnel: pour la documentation Swagger

export class CreateEnseignantDto {
  @ApiProperty({
    description: "L'ID de l'utilisateur existant qui deviendra enseignant.",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef", // Un exemple d'UUID
    format: 'uuid'
  })
  @IsString({ message: "L'ID de l'utilisateur doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "L'ID de l'utilisateur ne peut pas être vide." })
  @IsUUID('4', { message: "L'ID de l'utilisateur doit être un UUID valide." }) // Valide que c'est un UUID v4
  utilisateurId: string;
}