// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { SallesModule } from './salles/salles.module';
import { MatieresModule } from './matieres/matieres.module';
import { EnseignantsModule } from './enseignants/enseignants.module';
import { DepartementsModule } from './departements/departements.module';
import { NiveauxModule } from './niveaux/niveaux.module';
import { EtudiantsModule } from './etudiants/etudiants.module';
import { SeancesModule } from './seances/seances.module';
import { EnseignantMatiereModule } from './enseignant-matiere/enseignant-matiere.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Assurez-vous que le chemin vers votre .env est correct
      validationSchema: Joi.object({ // <-- AJOUTEZ CE BLOC DE VALIDATION
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(), // JWT_SECRET est requis !
        JWT_EXPIRES_IN: Joi.string().default('1h'), // Optionnel, avec valeur par défaut
        PORT: Joi.number().default(3000), // Optionnel, avec valeur par défaut
      }),
    }),
    UtilisateursModule,
    PrismaModule,
    AuthModule,
    SallesModule,
    MatieresModule,
    EnseignantsModule,
    DepartementsModule,
    NiveauxModule,
    EtudiantsModule,
    SeancesModule,
    EnseignantMatiereModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}