// src/auth/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Importer l'enum Role de Prisma

export const ROLES_KEY = 'roles'; // Clé unique pour stocker les métadonnées
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);