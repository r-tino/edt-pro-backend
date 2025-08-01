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
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Départements')
@ApiBearerAuth() // Indique que les routes de ce contrôleur nécessitent un token JWT
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
  async create(@Body() createDepartementDto: CreateDepartementDto) {
    const departement = await this.departementsService.create(createDepartementDto);
    return {
      message: 'Département créé avec succès.',
      data: departement,
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT) // Tous peuvent lister les départements
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister tous les départements' })
  @ApiResponse({ status: 200, description: 'Liste des départements récupérée avec succès.' })
  async findAll() {
    const departements = await this.departementsService.findAll();
    return { // Retourne un objet avec une clé 'data'
      message: 'Liste des départements récupérée avec succès.',
      data: departements,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT) // Tous peuvent voir un département spécifique
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtenir un département par ID' })
  @ApiResponse({ status: 200, description: 'Département trouvé avec succès.' })
  @ApiResponse({ status: 404, description: 'Département introuvable.' })
  async findOne(@Param('id') id: string) {
    const departement = await this.departementsService.findOne(id);
    return {
      message: 'Département trouvé avec succès.',
      data: departement,
    };
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
  async update(@Param('id') id: string, @Body() updateDepartementDto: UpdateDepartementDto) {
    const departement = await this.departementsService.update(id, updateDepartementDto);
    return {
      message: 'Département mis à jour avec succès.',
      data: departement,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Seuls les ADMIN peuvent supprimer les départements
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un département par ID' })
  @ApiResponse({ status: 200, description: 'Département supprimé avec succès.' })
  @ApiResponse({ status: 404, description: 'Département introuvable.' })
  @ApiResponse({ status: 409, description: 'Le département ne peut pas être supprimé car il a des niveaux associés.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  async remove(@Param('id') id: string) {
    const result = await this.departementsService.remove(id);
    return {
      message: 'Département supprimé avec succès.',
      data: result,
    };
  }
}
