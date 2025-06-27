// src/niveaux/niveaux.module.ts
import { Module } from '@nestjs/common';
import { NiveauxService } from './niveaux.service';
import { NiveauxController } from './niveaux.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; // Importez PrismaModule
import { DepartementsModule } from 'src/departements/departements.module'; // Importez DepartementsModule

@Module({
  imports: [
    PrismaModule,
    DepartementsModule, // Ajoutez DepartementsModule ici
  ],
  controllers: [NiveauxController],
  providers: [NiveauxService],
  exports: [NiveauxService], // Utile si d'autres modules ont besoin d'injecter NiveauxService
})
export class NiveauxModule {}