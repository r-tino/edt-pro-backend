// src/enseignants/enseignants.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { EnseignantsService } from './enseignants.service';
// import { CreateEnseignantDto } from './dto/create-enseignant.dto'; // <-- Supprimer cet import
import { UpdateEnseignantDto } from './dto/update-enseignant.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Enseignants')
@ApiBearerAuth()
@Controller('enseignants')
@UseGuards(JwtAuthGuard, RolesGuard) // Appliquer les guards à tout le contrôleur
export class EnseignantsController {
  constructor(private readonly enseignantsService: EnseignantsService) {}

  // La route POST pour la création manuelle d'un enseignant est supprimée,
  // car l'inscription se fait uniquement via /auth/register.
  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // @Roles(Role.ADMIN)
  // @ApiOperation({ summary: 'Créer un nouveau profil enseignant pour un utilisateur existant (déprécié)' })
  // @ApiResponse({ status: 201, description: 'Profil enseignant créé avec succès.' })
  // @ApiResponse({ status: 400, description: "L'utilisateur spécifié n'a pas le rôle ENSEIGNANT." })
  // @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  // @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
  // @ApiResponse({ status: 409, description: 'Un profil enseignant existe déjà pour cet utilisateur.' })
  // create(@Body() createEnseignantDto: CreateEnseignantDto) {
  //   return this.enseignantsService.create(createEnseignantDto);
  // }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.ETUDIANT) // Les ADMINs et ETUDIANTS peuvent lister les enseignants
  @ApiOperation({ summary: 'Lister tous les profils enseignants' })
  @ApiResponse({ status: 200, description: 'Liste des profils enseignants récupérée avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  findAll() {
    return this.enseignantsService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  // Tous les utilisateurs authentifiés peuvent voir un profil enseignant.
  // Une logique plus fine peut être ajoutée si un enseignant ne doit voir QUE son propre profil.
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT)
  @ApiOperation({ summary: 'Obtenir un profil enseignant par ID' })
  @ApiResponse({ status: 200, description: 'Profil enseignant trouvé avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Profil enseignant introuvable.' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    // Si l'utilisateur est un ENSEIGNANT, s'assurer qu'il accède à son propre profil.
    // Pour cela, nous devons récupérer le profil enseignant pour vérifier son utilisateurId.
    const enseignantProfile = await this.enseignantsService.findOne(id);
    if (user.role === Role.ENSEIGNANT && enseignantProfile.utilisateurId !== user.id) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à accéder à ce profil enseignant.");
    }
    return enseignantProfile; // Retourne l'enseignantProfile déjà récupéré
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.ENSEIGNANT) // ADMIN ou un ENSEIGNANT peut modifier son propre profil
  @ApiOperation({ summary: 'Mettre à jour un profil enseignant par ID' })
  @ApiResponse({ status: 200, description: 'Profil enseignant mis à jour avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Profil enseignant non trouvé.' })
  update(@Param('id') id: string, @Body() updateEnseignantDto: UpdateEnseignantDto, @Req() req: Request) {
    const user = req.user as any;
    if (user.role !== Role.ADMIN) {
        // Vérifier si l'enseignant connecté essaie de modifier son propre profil
        if (user.role === Role.ENSEIGNANT && user.enseignantProfile?.id !== id) {
             throw new ForbiddenException("Vous n'êtes pas autorisé à modifier ce profil enseignant.");
        }
    }
    return this.enseignantsService.update(id, updateEnseignantDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN) // Seuls les ADMINs peuvent supprimer un profil enseignant
  @ApiOperation({ summary: 'Supprimer un profil enseignant par ID' })
  @ApiResponse({ status: 200, description: 'Profil enseignant supprimé avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Profil enseignant non trouvé.' })
  @ApiResponse({ status: 409, description: 'Le profil enseignant ne peut pas être supprimé car il est lié à d\'autres enregistrements.' })
  remove(@Param('id') id: string) {
    return this.enseignantsService.remove(id);
  }
}