// src/prisma/prisma.service.ts

import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            // Configuration des niveaux de log ici
            log: ['query', 'info', 'warn', 'error'],
        });
    }
  async onModuleInit() {
    // Se connecter à la base de données quand le module est initialisé
    await this.$connect();
    console.log('PrismaService connecté à la base de données.');
  }

  async onModuleDestroy() {
    // Se déconnecter de la base de données quand le module est détruit
    await this.$disconnect();
    console.log('PrismaService déconnecté de la base de données.');
  }
}