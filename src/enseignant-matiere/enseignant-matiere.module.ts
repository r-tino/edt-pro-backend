import { Module } from '@nestjs/common';
import { EnseignantMatiereController } from './enseignant-matiere.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [EnseignantMatiereController],
  providers: [PrismaService],
})
export class EnseignantMatiereModule {}