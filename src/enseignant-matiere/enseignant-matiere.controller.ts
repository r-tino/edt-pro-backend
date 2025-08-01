import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enseignant-matiere')
export class EnseignantMatiereController {
  constructor(private prisma: PrismaService) {}

  @Roles(Role.ADMIN, Role.ENSEIGNANT)
  @Get()
  async findAll() {
    // Retourne toutes les relations enseignant-matiere
    const relations = await this.prisma.enseignantMatiere.findMany({
      select: {
        enseignantId: true,
        matiereId: true,
      },
    });
    return { data: relations };
  }
}