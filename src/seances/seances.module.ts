// src/seances/seances.module.ts
import { Module } from '@nestjs/common';
import { SeancesService } from './seances.service';
import { SeancesController } from './seances.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module'; // Importez AuthModule car les guards en dépendent

@Module({
  imports: [
    PrismaModule,
    AuthModule, // Nécessaire pour les JwtAuthGuard et RolesGuard
  ],
  controllers: [SeancesController],
  providers: [SeancesService],
  exports: [SeancesService], // Exportez le service si d'autres modules en auront besoin
})
export class SeancesModule {}
