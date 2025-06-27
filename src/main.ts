// src/main.ts

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS
  app.enableCors({
    origin: 'http://localhost:3001', // Autorise uniquement les requêtes de votre frontend Next.js sur le port 3001
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Méthodes HTTP autorisées
    credentials: true, // Autorise l'envoi de cookies, en-têtes d'autorisation, etc.
  });

  // Activation de la validation des données
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Supprime les propriétés qui ne sont pas définies dans le DTO
    forbidNonWhitelisted: true, // Lance une erreur si des propriétés non-listées sont envoyées
    transform: true, // Transforme les types des requêtes (ex: '123' en 123 pour un nombre)
  }));

  // Configuration Swagger (OpenAPI)
  const config = new DocumentBuilder()
    .setTitle('API Gestion Emploi du Temps')
    .setDescription("Description de l'API de gestion d'emploi du temps pour une université ou une école.")
    .setVersion('1.0')
    .addBearerAuth() // Active l'authentification par Bearer Token (JWT)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // L'interface Swagger sera disponible sur /api
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application NestJS en cours d'exécution sur le port ${port}`);

  // Arrêt Gracieux
  app.enableShutdownHooks();
}
bootstrap();