// src/matieres/matieres.controller.ts (Backend)
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { MatieresService } from './matieres.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'; // Ajout de ApiBearerAuth et ApiQuery
import { Public } from 'src/auth/public.decorator'; // Import du décorateur Public

@ApiTags('Matières') // Tag pour Swagger UI
@ApiBearerAuth() // Indique que ce contrôleur utilise l'authentification par Bearer Token par défaut pour Swagger
@Controller('matieres')
@UseGuards(JwtAuthGuard, RolesGuard) // Applique les Guards JWT et de Rôles à toutes les routes du contrôleur
export class MatieresController {
  constructor(private readonly matieresService: MatieresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle matière pour un niveau spécifique' })
  @ApiBody({ type: CreateMatiereDto })
  @ApiResponse({ status: 201, description: 'Matière créée avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Le niveau spécifié est introuvable.' })
  @ApiResponse({ status: 409, description: 'Une matière avec le même nom existe déjà pour ce niveau.' })
  async create(@Body() createMatiereDto: CreateMatiereDto) {
    const matiere = await this.matieresService.create(createMatiereDto);
    return {
      message: 'Matière créée avec succès.',
      data: matiere,
    };
  }

  @Public() // <-- Marque cette route comme publique !
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister toutes les matières (avec filtrage optionnel par niveau)' })
  @ApiQuery({ name: 'niveauId', required: false, type: String, description: 'Filtre les matières par ID de niveau.' }) // Ajout de l'annotation pour le paramètre de requête
  @ApiResponse({ status: 200, description: 'Liste des matières récupérée avec succès.' })
  // @ApiResponse({ status: 403, description: 'Accès non autorisé.' }) // Plus nécessaire car publique
  async findAll(@Query('niveauId') niveauId?: string) { // Ajout du paramètre de requête niveauId
    const matieres = await this.matieresService.findAll(niveauId);
    return {
      message: 'Liste des matières récupérée avec succès.',
      data: matieres,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtenir une matière par ID' })
  @ApiResponse({ status: 200, description: 'Matière trouvée avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Matière introuvable.' })
  async findOne(@Param('id') id: string) {
    const matiere = await this.matieresService.findOne(id);
    return {
      message: `Matière récupérée avec succès.`,
      data: matiere,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour une matière par ID' })
  @ApiBody({ type: UpdateMatiereDto })
  @ApiResponse({ status: 200, description: 'Matière mise à jour avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Matière ou nouveau niveau introuvable.' })
  @ApiResponse({ status: 409, description: 'Une matière avec le nom et/ou le niveau mis à jour existe déjà.' })
  async update(@Param('id') id: string, @Body() updateMatiereDto: UpdateMatiereDto) {
    const matiere = await this.matieresService.update(id, updateMatiereDto);
    return {
      message: `Matière mise à jour avec succès.`,
      data: matiere,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une matière par ID' })
  @ApiResponse({ status: 200, description: 'Matière supprimée avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Matière introuvable.' })
  @ApiResponse({ status: 409, description: 'La matière ne peut pas être supprimée car elle est liée à d\'autres enregistrements.' })
  async remove(@Param('id') id: string) {
    return await this.matieresService.remove(id);
  }
}
