// src/departements/departements.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DepartementsService } from './departements.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Départements')
@Controller('departements')
@UseGuards(JwtAuthGuard, RolesGuard) // Appliquer les gardes JWT et de Rôle à tout le contrôleur
export class DepartementsController {
  constructor(private readonly departementsService: DepartementsService) {}

  @Post()
  @Roles(Role.ADMIN) // Seuls les ADMIN peuvent créer des départements
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau département' })
  @ApiBody({ type: CreateDepartementDto })
  @ApiResponse({ status: 201, description: 'Département créé avec succès.' })
  @ApiResponse({ status: 409, description: 'Un département avec ce nom existe déjà.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  create(@Body() createDepartementDto: CreateDepartementDto) {
    return this.departementsService.create(createDepartementDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT) // Tous peuvent lister les départements
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister tous les départements' })
  @ApiResponse({ status: 200, description: 'Liste des départements récupérée avec succès.' })
  findAll() {
    return this.departementsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT) // Tous peuvent voir un département spécifique
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtenir un département par ID' })
  @ApiResponse({ status: 200, description: 'Département trouvé avec succès.' })
  @ApiResponse({ status: 404, description: 'Département introuvable.' })
  findOne(@Param('id') id: string) {
    return this.departementsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN) // Seuls les ADMIN peuvent mettre à jour les départements
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour un département par ID' })
  @ApiBody({ type: UpdateDepartementDto })
  @ApiResponse({ status: 200, description: 'Département mis à jour avec succès.' })
  @ApiResponse({ status: 404, description: 'Département introuvable.' })
  @ApiResponse({ status: 409, description: 'Un département avec le nom mis à jour existe déjà.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  update(@Param('id') id: string, @Body() updateDepartementDto: UpdateDepartementDto) {
    return this.departementsService.update(id, updateDepartementDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Seuls les ADMIN peuvent supprimer les départements
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un département par ID' })
  @ApiResponse({ status: 200, description: 'Département supprimé avec succès.' })
  @ApiResponse({ status: 404, description: 'Département introuvable.' })
  @ApiResponse({ status: 409, description: 'Le département ne peut pas être supprimé car il a des niveaux associés.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  remove(@Param('id') id: string) {
    return this.departementsService.remove(id);
  }
}