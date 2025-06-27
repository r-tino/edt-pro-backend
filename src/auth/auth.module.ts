// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Importez ConfigModule et ConfigService
import { RolesGuard } from './roles.guard'; // Importez RolesGuard
import { MailModule } from 'src/mail/mail.module'; // <-- Importez le MailModule

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ConfigModule, // Indique que ce module utilisera ConfigService pour lire les variables d'environnement
    JwtModule.registerAsync({
      imports: [ConfigModule], // Importe ConfigModule pour que ConfigService soit disponible
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' }, // Token expire en 60 minutes
      }),
      inject: [ConfigService], // Injecte ConfigService
    }),
    MailModule, // <-- Ajoutez MailModule ici
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, RolesGuard], // RolesGuard est un provider
  exports: [AuthService, JwtModule, PassportModule, RolesGuard], // Exportez AuthService et d'autres si nécessaire
})
export class AuthModule {}






// // src/auth/auth.module.ts
// import { Module } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { LocalStrategy } from './local.strategy';
// import { JwtModule } from '@nestjs/jwt';
// import { JwtStrategy } from './jwt.strategy';
// import { PrismaModule } from '../prisma/prisma.module';
// import { ConfigModule, ConfigService } from '@nestjs/config'; // <-- Importer ConfigModule et ConfigService

// @Module({
//   imports: [
//     PrismaModule,
//     ConfigModule, // <-- Importer ConfigModule
//     JwtModule.registerAsync({ // <-- Utiliser registerAsync pour charger la config de manière asynchrone
//       imports: [ConfigModule], // Déclarer la dépendance à ConfigModule
//       useFactory: async (configService: ConfigService) => ({
//         secret: configService.get<string>('JWT_SECRET'), // <-- Lire la clé depuis .env
//         signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h' }, // <-- Lire la durée
//       }),
//       inject: [ConfigService], // Injecter ConfigService dans la factory
//     }),
//   ],
//   providers: [AuthService, LocalStrategy, JwtStrategy],
//   controllers: [AuthController],
// })
// export class AuthModule {}