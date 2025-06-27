// src/salles/salles.module.ts
import { Module } from '@nestjs/common';
import { SallesService } from './salles.service';
import { SallesController } from './salles.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; // Importez PrismaModule
import { AuthModule } from 'src/auth/auth.module';     // Importez AuthModule

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [SallesController],
  providers: [SallesService],
})
export class SallesModule {}