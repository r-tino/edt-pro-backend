// src/departements/departements.module.ts
import { Module } from '@nestjs/common';
import { DepartementsService } from './departements.service';
import { DepartementsController } from './departements.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; // Importez PrismaModule

@Module({
  imports: [PrismaModule], // Ajoutez PrismaModule ici
  controllers: [DepartementsController],
  providers: [DepartementsService],
  exports: [DepartementsService], // Utile si d'autres modules ont besoin d'injecter DepartementsService
})
export class DepartementsModule {}