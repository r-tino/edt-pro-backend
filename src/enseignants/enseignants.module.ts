// src/enseignants/enseignants.module.ts
import { Module } from '@nestjs/common';
import { EnseignantsService } from './enseignants.service';
import { EnseignantsController } from './enseignants.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; // Importez PrismaModule

@Module({
  imports: [PrismaModule], // Ajoutez PrismaModule ici
  controllers: [EnseignantsController],
  providers: [EnseignantsService],
  exports: [EnseignantsService] // Exporter le service si d'autres modules en ont besoin
})
export class EnseignantsModule {}