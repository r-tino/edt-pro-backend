// src/auth/auth.controller.ts
import { Controller, Post, Request, UseGuards, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto'; // <-- Ajouté
import { ResetPasswordDto } from './dto/reset-password.dto';       // <-- Ajouté
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enregistrer un nouvel utilisateur avec un rôle spécifique' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'Utilisateur et profil enregistrés avec succès.' })
  @ApiResponse({ status: 400, description: 'Données d\'inscription invalides (ex: informations de profil manquantes).' })
  @ApiResponse({ status: 403, description: 'Le rôle ADMIN ne peut pas être choisi lors de l\'inscription.' })
  @ApiResponse({ status: 404, description: 'Le Niveau spécifié pour l\'étudiant n\'existe pas.' })
  @ApiResponse({ status: 409, description: 'Un utilisateur avec cet email existe déjà.' })
  @ApiResponse({ status: 500, description: 'Erreur interne du serveur.' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connecter un utilisateur et obtenir un jeton d\'accès' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 200, description: 'Connexion réussie.' })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect.' })
  async login(@Request() req: { user: { id: string, email: string, role: Role, nom: string } }) {
    return this.authService.login(req.user);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander une réinitialisation de mot de passe' })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({ status: 200, description: 'Si un compte est associé à cette adresse e-mail, un lien de réinitialisation vous a été envoyé.' })
  @ApiResponse({ status: 400, description: 'Requête invalide (email manquant ou invalide).' })
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(requestPasswordResetDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec un jeton' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Votre mot de passe a été réinitialisé avec succès.' })
  @ApiResponse({ status: 400, description: 'Jeton invalide ou expiré, ou adresse e-mail/mot de passe invalide.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}