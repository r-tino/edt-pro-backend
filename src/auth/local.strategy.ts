// src/auth/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ 
      usernameField: 'email',
      passwordField: 'motDePasse',
    }); // Utilise "email" au lieu de "username"
  }

  async validate(email: string, motDePasse: string): Promise<any> {
    const user = await this.authService.validateUser(email, motDePasse);
    if (!user) {
      // Cette exception est levée par authService.validateUser si l'utilisateur ou le mot de passe est incorrect.
      // Le guard AuthGuard(local) la re-lèvera comme 401 Unauthorized.
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    return user;
  }
}