// src/prisma/prisma.module.ts

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService], // Déclare PrismaService comme un fournisseur de ce module
  exports: [PrismaService],   // Rend PrismaService disponible pour les modules qui importent PrismaModule
})
export class PrismaModule {}