// src/matieres/matieres.module.ts
import { Module } from '@nestjs/common';
import { MatieresService } from './matieres.service';
import { MatieresController } from './matieres.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; // Importez PrismaModule
import { NiveauxModule } from 'src/niveaux/niveaux.module'; // Importez NiveauxModule

@Module({
  imports: [
    PrismaModule,
    NiveauxModule, // Ajoutez NiveauxModule ici
  ],
  controllers: [MatieresController],
  providers: [MatieresService],
  exports: [MatieresService], // Utile si d'autres modules (comme les séances) auront besoin d'injecter MatieresService
})
export class MatieresModule {}