// src/etudiants/etudiants.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, ForbiddenException, Req } from '@nestjs/common';
import { EtudiantsService } from './etudiants.service';
// import { CreateEtudiantDto } from './dto/create-etudiant.dto'; // <-- Supprimer cet import
import { UpdateEtudiantDto } from './dto/update-etudiant.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express'; // Importez le type Request depuis 'express'

@ApiTags('Étudiants')
@ApiBearerAuth() // Indique que les routes de ce contrôleur nécessitent un token JWT
@Controller('etudiants')
@UseGuards(JwtAuthGuard, RolesGuard) // Applique les Guards JWT et de Rôles à toutes les routes du contrôleur
export class EtudiantsController {
  constructor(private readonly etudiantsService: EtudiantsService) {}

  // La route POST pour la création d'un profil étudiant est supprimée,
  // car l'inscription et la création du profil associé se font via /auth/register.
  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // @Roles(Role.ADMIN)
  // @ApiOperation({ summary: 'Créer un nouveau profil étudiant (déprécié)' })
  // @ApiBody({ type: CreateEtudiantDto })
  // @ApiResponse({ status: 201, description: 'Profil étudiant créé avec succès.' })
  // @ApiResponse({ status: 400, description: "L'utilisateur spécifié n'a pas le rôle 'ETUDIANT'." })
  // @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  // @ApiResponse({ status: 404, description: 'Utilisateur ou niveau introuvable.' })
  // @ApiResponse({ status: 409, description: 'Un profil étudiant existe déjà pour cet utilisateur ou le matricule est déjà utilisé.' })
  // async create(@Body() createEtudiantDto: CreateEtudiantDto) {
  //   const etudiant = await this.etudiantsService.create(createEtudiantDto);
  //   return {
  //     message: 'Profil étudiant créé avec succès.',
  //     data: etudiant,
  //   };
  // }

  @Get()
  @Roles(Role.ADMIN, Role.ENSEIGNANT) // ADMINs et ENSEIGNANTs peuvent lister les étudiants
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister tous les profils étudiants' })
  @ApiResponse({ status: 200, description: 'Liste des profils étudiants récupérée avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  async findAll() {
    const etudiants = await this.etudiantsService.findAll();
    return {
      message: 'Liste des profils étudiants récupérée avec succès.',
      data: etudiants,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT) // Tous les rôles peuvent voir un étudiant (un ETUDIANT peut voir son propre profil)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtenir un profil étudiant par ID' })
  @ApiResponse({ status: 200, description: 'Profil étudiant trouvé avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Profil étudiant introuvable.' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any; // Cast 'req.user' en 'any' pour résoudre l'erreur TypeScript
    const etudiant = await this.etudiantsService.findOne(id);

    // Si l'utilisateur connecté est un ETUDIANT, il ne peut accéder qu'à son propre profil.
    // L'ID du profil étudiant (param 'id') doit correspondre à l'ID du profil de l'utilisateur connecté.
    if (user.role === Role.ETUDIANT && etudiant.utilisateurId !== user.id) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder à ce profil étudiant.");
    }
    return {
      message: `Profil étudiant récupéré avec succès.`,
      data: etudiant,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ETUDIANT) // ADMIN ou un ETUDIANT peut modifier son propre profil
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour un profil étudiant par ID' })
  @ApiBody({ type: UpdateEtudiantDto })
  @ApiResponse({ status: 200, description: 'Profil étudiant mis à jour avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Profil étudiant ou nouveau niveau introuvable.' })
  @ApiResponse({ status: 409, description: 'Le matricule est déjà utilisé.' })
  async update(@Param('id') id: string, @Body() updateEtudiantDto: UpdateEtudiantDto, @Req() req: Request) {
    const user = req.user as any; // Cast 'req.user' en 'any' pour résoudre l'erreur TypeScript

    // Si l'utilisateur n'est pas un ADMIN et est un ETUDIANT, vérifier qu'il modifie son propre profil
    if (user.role === Role.ETUDIANT) {
      const etudiantProfile = await this.etudiantsService.findOne(id); // Récupérer le profil pour vérifier l'utilisateurId
      if (etudiantProfile.utilisateurId !== user.id) {
        throw new ForbiddenException("Vous n'êtes pas autorisé à modifier ce profil étudiant.");
      }
    }
    const etudiant = await this.etudiantsService.update(id, updateEtudiantDto);
    return {
      message: `Profil étudiant mis à jour avec succès.`,
      data: etudiant,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Seuls les ADMINs peuvent supprimer un profil étudiant
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un profil étudiant par ID' })
  @ApiResponse({ status: 200, description: 'Profil étudiant supprimé avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Profil étudiant introuvable.' })
  @ApiResponse({ status: 409, description: 'Le profil étudiant ne peut pas être supprimé car il est lié à d\'autres enregistrements.' })
  async remove(@Param('id') id: string) {
    return await this.etudiantsService.remove(id);
  }
}