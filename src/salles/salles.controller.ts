// src/salles/salles.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SallesService } from './salles.service';
import { CreateSalleDto } from './dto/create-salle.dto';
import { UpdateSalleDto } from './dto/update-salle.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('salles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SallesController {
  constructor(private readonly sallesService: SallesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) // Maintient le statut 201 Created pour la création
  @Roles(Role.ADMIN)
  async create(@Body() createSalleDto: CreateSalleDto) {
    const salle = await this.sallesService.create(createSalleDto);
    return {
      message: 'Salle créée avec succès.',
      data: salle, // Les données de la salle nouvellement créée
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT)
  async findAll() {
    const salles = await this.sallesService.findAll();
    return {
      message: 'Liste des salles récupérée avec succès.',
      data: salles, // La liste de toutes les salles
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT)
  async findOne(@Param('id') id: string) {
    const salle = await this.sallesService.findOne(id);
    return {
      message: `Salle récupérée avec succès.`,
      data: salle, // Les données de la salle spécifique
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateSalleDto: UpdateSalleDto) {
    const salle = await this.sallesService.update(id, updateSalleDto);
    return {
      message: `Salle mis à jour avec succès.`,
      data: salle, // Les données de la salle mise à jour
    };
  }

  @Delete(':id')
  // Nous laissons le statut par défaut à 200 OK pour que le message du service soit bien visible dans la réponse.
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    // Le service retourne déjà { message: 'Salle supprimée avec succès.' }.
    // Nous pouvons directement retourner cette valeur.
    return await this.sallesService.remove(id);
  }
}