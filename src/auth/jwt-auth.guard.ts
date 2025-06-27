// src/auth/jwt-auth.guard.ts (Backend)
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core'; // Importez le Reflector
import { IS_PUBLIC_KEY } from './public.decorator'; // Importez la clé publique

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Vérifier si la route actuelle est marquée comme "publique"
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la route est publique, autoriser l'accès sans authentification
    if (isPublic) {
      return true;
    }

    // Sinon, la garde d'authentification JWT normale s'applique
    return super.canActivate(context);
  }
}
