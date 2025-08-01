import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, Req, Query } from '@nestjs/common';
import { SeancesService } from './seances.service';
import { CreateSeanceDto } from './dto/create-seance.dto';
import { UpdateSeanceDto } from './dto/update-seance.dto';
import { FindSeancesFilterDto } from './dto/find-seances-filter.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Séances')
@ApiBearerAuth()
@Controller('seances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeancesController {
  constructor(private readonly seancesService: SeancesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.ENSEIGNANT)
  @ApiOperation({ summary: 'Créer une nouvelle séance' })
  @ApiBody({ type: CreateSeanceDto })
  @ApiResponse({ status: 201, description: 'Séance créée avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides ou incohérentes.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Ressource liée (niveau, enseignant, matière, salle) introuvable.' })
  @ApiResponse({ status: 409, description: 'Conflit d\'horaire pour l\'enseignant ou la salle.' })
  async create(@Body() createSeanceDto: CreateSeanceDto, @Req() req: Request) {
    const user = req.user as any;
    const seance = await this.seancesService.create(createSeanceDto, user.id);
    return {
      message: 'Séance créée avec succès.',
      data: seance,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT)
  @ApiOperation({ summary: 'Lister toutes les séances avec filtres optionnels' })
  @ApiQuery({ name: 'niveauId', type: String, required: false, description: "Filtrer par l'ID du niveau" })
  @ApiQuery({ name: 'enseignantId', type: String, required: false, description: "Filtrer par l'ID de l'enseignant" })
  @ApiQuery({ name: 'matiereId', type: String, required: false, description: "Filtrer par l'ID de la matière" })
  @ApiQuery({ name: 'salleId', type: String, required: false, description: "Filtrer par l'ID de la salle" })
  @ApiQuery({ name: 'date', type: String, required: false, description: "Filtrer par la date précise (YYYY-MM-DD)" })
  @ApiQuery({ name: 'anneeScolaire', type: String, required: false, description: "Filtrer par l'année scolaire (ex: 2024-2025)" })
  @ApiQuery({ name: 'semestre', type: String, required: false, description: "Filtrer par le semestre (ex: S1, S2)" })
  @ApiResponse({ status: 200, description: 'Liste des séances filtrées récupérée avec succès ou message indiquant aucune séance.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  async findAll(@Query() filters: FindSeancesFilterDto) {
    const seances = await this.seancesService.findAll(filters);

    if (seances.length === 0) {
      return {
        message: 'Aucune séance trouvée correspondant aux critères de recherche.',
        data: [],
      };
    }

    return {
      message: 'Liste des séances récupérée avec succès.',
      data: seances,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT)
  @ApiOperation({ summary: 'Obtenir une séance par ID' })
  @ApiResponse({ status: 200, description: 'Séance trouvée avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Séance introuvable.' })
  async findOne(@Param('id') id: string) {
    const seance = await this.seancesService.findOne(id);
    return {
      message: `Séance récupérée avec succès.`,
      data: seance,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.ENSEIGNANT)
  @ApiOperation({ summary: 'Mettre à jour une séance par ID' })
  @ApiBody({ type: UpdateSeanceDto })
  @ApiResponse({ status: 200, description: 'Séance mise à jour avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides ou incohérentes.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Séance ou ressource liée introuvable.' })
  @ApiResponse({ status: 409, description: 'Conflit d\'horaire pour l\'enseignant ou la salle.' })
  async update(@Param('id') id: string, @Body() updateSeanceDto: UpdateSeanceDto, @Req() req: Request) {
    const user = req.user as any;
    const seance = await this.seancesService.update(id, updateSeanceDto, user.id);
    return {
      message: `Séance mise à jour avec succès.`,
      data: seance,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.ENSEIGNANT)
  @ApiOperation({ summary: 'Supprimer une séance par ID' })
  @ApiResponse({ status: 200, description: 'Séance supprimée avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Séance introuvable.' })
  @ApiResponse({ status: 409, description: 'Impossible de supprimer la séance car elle est liée à d\'autres enregistrements.' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return await this.seancesService.remove(id, user.id);
  }
}