// src/niveaux/niveaux.controller.ts (Backend)
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { NiveauxService } from './niveaux.service';
import { CreateNiveauDto } from './dto/create-niveau.dto';
import { UpdateNiveauDto } from './dto/update-niveau.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { Public } from 'src/auth/public.decorator';

@ApiTags('Niveaux')
@Controller('niveaux')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class NiveauxController {
  constructor(private readonly niveauxService: NiveauxService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau niveau' })
  @ApiBody({ type: CreateNiveauDto })
  @ApiResponse({ status: 201, description: 'Niveau créé avec succès.' })
  @ApiResponse({ status: 404, description: 'Département introuvable.' })
  @ApiResponse({ status: 409, description: 'Un niveau avec ce nom existe déjà pour ce département.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  async create(@Body() createNiveauDto: CreateNiveauDto) { // Ajout de 'async'
    const niveau = await this.niveauxService.create(createNiveauDto); // Attendre la promesse
    return {
      message: 'Niveau créé avec succès.',
      data: niveau, // Encapsulez la réponse dans 'data'
    };
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister tous les niveaux' })
  @ApiResponse({ status: 200, description: 'Liste des niveaux récupérée avec succès.' })
  async findAll() { // Ajout de 'async'
    const niveaux = await this.niveauxService.findAll(); // Attendre la promesse
    return {
      message: 'Liste des niveaux récupérée avec succès.',
      data: niveaux, // <-- MODIFICATION CLÉ ICI : encapsulez la liste dans 'data'
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtenir un niveau par ID' })
  @ApiResponse({ status: 200, description: 'Niveau trouvé avec succès.' })
  @ApiResponse({ status: 404, description: 'Niveau introuvable.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  async findOne(@Param('id') id: string) { // Ajout de 'async'
    const niveau = await this.niveauxService.findOne(id); // Attendre la promesse
    return {
      message: `Niveau récupéré avec succès.`,
      data: niveau, // Encapsulez la réponse dans 'data'
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour un niveau par ID' })
  @ApiBody({ type: UpdateNiveauDto })
  @ApiResponse({ status: 200, description: 'Niveau mis à jour avec succès.' })
  @ApiResponse({ status: 404, description: 'Niveau ou département introuvable.' })
  @ApiResponse({ status: 409, description: 'Un niveau avec le nom et/ou le département mis à jour existe déjà.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  async update(@Param('id') id: string, @Body() updateNiveauDto: UpdateNiveauDto) { // Ajout de 'async'
    const niveau = await this.niveauxService.update(id, updateNiveauDto); // Attendre la promesse
    return {
      message: `Niveau mis à jour avec succès.`,
      data: niveau, // Encapsulez la réponse dans 'data'
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un niveau par ID' })
  @ApiResponse({ status: 200, description: 'Niveau supprimé avec succès.' })
  @ApiResponse({ status: 404, description: 'Niveau introuvable.' })
  @ApiResponse({ status: 409, description: 'Le niveau ne peut pas être supprimé car il a des entités associées.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  async remove(@Param('id') id: string) { // Ajout de 'async'
    const result = await this.niveauxService.remove(id); // Attendre la promesse
    // Le service remove renvoie déjà un objet { message: ... }
    return result; // Pas besoin d'encapsuler dans 'data' ici si le service gère déjà le message
  }
}