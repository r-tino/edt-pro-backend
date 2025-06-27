// src/auth/dto/login-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ description: 'Adresse email de l\'utilisateur', example: 'jean.dupont@example.com' })
  @IsEmail({}, { message: 'L\'email doit être une adresse email valide.' })
  @IsNotEmpty({ message: 'L\'email ne peut pas être vide.' })
  email: string;

  @ApiProperty({ description: 'Mot de passe de l\'utilisateur', example: 'MotDePasse123!' })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le mot de passe ne peut pas être vide.' })
  motDePasse: string;
}