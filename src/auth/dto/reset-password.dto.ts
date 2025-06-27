// src/auth/dto/reset-password.dto.ts
import { IsString, IsNotEmpty, MinLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: "L'adresse e-mail de l'utilisateur.",
    example: "utilisateur@example.com",
  })
  @IsEmail({}, { message: "L'adresse e-mail n'est pas valide." })
  @IsNotEmpty({ message: "L'adresse e-mail est obligatoire." })
  email: string;

  @ApiProperty({
    description: "Le jeton de réinitialisation de mot de passe reçu par e-mail.",
    example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  })
  @IsString({ message: "Le jeton doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le jeton est obligatoire." })
  token: string;

  @ApiProperty({
    description: "Le nouveau mot de passe de l'utilisateur. Minimum 6 caractères.",
    example: "nouveauMotDePasse123",
  })
  @IsString({ message: "Le mot de passe doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le mot de passe ne peut pas être vide." })
  @MinLength(6, { message: "Le mot de passe doit contenir au moins 6 caractères." })
  newPassword: string;
}
