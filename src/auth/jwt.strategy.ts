// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'; // Importer UnauthorizedException
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      // Si la validation Joi n'a pas arrêté l'application (ce qui est rare si elle est bien configurée),
      // nous lançons une erreur ici pour éviter un comportement indéfini.
      throw new UnauthorizedException('JWT_SECRET n\'est pas configuré. Veuillez vérifier votre fichier .env.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // Maintenant, TypeScript sait que jwtSecret est une string
    });
  }

  async validate(payload: any) {
    // Le payload est ce qui est stocké dans le JWT (sub, email, role)
    // Ici, vous pouvez également chercher l'utilisateur dans la DB si nécessaire
    // pour s'assurer qu'il existe toujours et est actif, mais pour l'instant,
    // retourner le payload est suffisant pour les infos de base.
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}