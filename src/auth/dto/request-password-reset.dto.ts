// src/auth/dto/request-password-reset.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({
    description: "L'adresse e-mail de l'utilisateur qui demande la réinitialisation de mot de passe.",
    example: "utilisateur@example.com",
  })
  @IsEmail({}, { message: "L'adresse e-mail n'est pas valide." })
  @IsNotEmpty({ message: "L'adresse e-mail est obligatoire." })
  email: string;
}