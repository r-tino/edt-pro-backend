// src/utilisateurs/utilisateurs.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';

@Controller('utilisateurs') // Chemin de base de l'API : /utilisateurs
@UseGuards(JwtAuthGuard, RolesGuard)
export class UtilisateursController {
  constructor(private readonly utilisateursService: UtilisateursService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createUtilisateurDto: CreateUtilisateurDto) {
    return this.utilisateursService.create(createUtilisateurDto);
  }

  // Seuls les ADMINs peuvent peuvent lire tous les utilisateurs
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.utilisateursService.findAll();
  }

  // Permet à un utilisateur de récupérer SON propre compte, ou à un ADMIN de récupérer n'importe quel compte.
  @Get(':id')
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT)
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any; // Récupère l'utilisateur connecté depuis la requête

    // Vérifier si l'utilisateur connecté est un ADMIN ou s'il essaie d'accéder à son propre compte.
    if (user.role !== Role.ADMIN && user.id !== id) {
      // Si l'utilisateur n'est pas ADMIN et n'essaie pas d'accéder à son propre compte, lever une exception.
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder à ce compte utilisateur.");
    }

    // Si l'utilisateur est ADMIN ou accède à son propre compte, continuer normalement.
    return this.utilisateursService.findOne(id);
  }

  // Seuls les ADMINs, ENSEIGNANTs et STANDARDs peuvent mettre à jour un utilisateur
  // Mais un utilisateur ne peut mettre à jour que SON propre compte.
  @Patch(':id')
  @Roles(Role.ADMIN, Role.ENSEIGNANT, Role.ETUDIANT)
  update(@Param('id') id: string, @Body() updateUtilisateurDto: UpdateUtilisateurDto, @Req() req: Request) {
    // Récupérer l'utilisateur connecté depuis la requête
    const user = req.user as any;

    //Vérifier si l'utilisateur connecté est un ADMIN ou s'il essaie de mettre à jour son propre compte.
    if (user.role !== Role.ADMIN && user.id !== id) {
      // Si l'utilisateur n'est pas ADMIN et n'essaie pas de mettre à jour son propre compte, lever une exception.
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier ce compte utilisateur.");
    }

    // Si l'utilisateur est ADMIN ou met à jour son propre compte, continuer normalement.
    // Note : L'ID de l'utilisateur à mettre à jour est passé dans l'URL, et le DTO contient les champs à mettre à jour.
    return this.utilisateursService.update(id, updateUtilisateurDto);
  }

  // Seuls les ADMINs peuvent supprimer des utilisateurs
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.utilisateursService.remove(id);
  }
}
