// src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client'; // Importer l'enum Role de Prisma
import { ROLES_KEY } from './roles.decorator'; // Importer la clé du décorateur de rôles

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Récupérer les rôles requis définis par le décorateur @Roles() sur la route
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // Pour la méthode
      context.getClass(),    // Pour la classe du contrôleur
    ]);

    if (!requiredRoles) {
      // S'il n'y a pas de rôles requis, la route est accessible à tous les authentifiés
      return true;
    }

    // Récupérer l'utilisateur à partir de la requête (ajouté par JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Vérifier si le rôle de l'utilisateur correspond à l'un des rôles requis
    // user.role est de type Role (enum)
    return requiredRoles.some((role) => user.role === role);
  }
}