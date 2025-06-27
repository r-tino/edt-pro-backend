// src/etudiants/etudiants.module.ts
import { Module } from '@nestjs/common';
import { EtudiantsService } from './etudiants.service';
import { EtudiantsController } from './etudiants.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
// import { UtilisateursModule } from 'src/utilisateurs/utilisateurs.module'; // Pas directement nécessaire ici, PrismaService est injecté
// import { NiveauxModule } from 'src/niveaux/niveaux.module'; // Pas directement nécessaire ici, PrismaService est injecté

@Module({
  imports: [
    PrismaModule,
    // UtilisateursModule, // Ces modules ne sont pas directement utilisés par EtudiantsService pour ses opérations CRUD de base.
    // NiveauxModule,     // Le service interagit directement avec Prisma.
  ],
  controllers: [EtudiantsController],
  providers: [EtudiantsService],
  exports: [EtudiantsService], // Important si d'autres modules (ex: authentification, notes) ont besoin d'interagir avec EtudiantsService
})
export class EtudiantsModule {}
