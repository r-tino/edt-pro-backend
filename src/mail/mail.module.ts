// src/mail/mail.module.ts
import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config'; // Importez ConfigModule

@Global() // Rendre le MailService disponible globalement (ou l'importer explicitement où nécessaire)
@Module({
  imports: [ConfigModule], // Importez ConfigModule pour accéder aux variables d'environnement
  providers: [MailService],
  exports: [MailService], // Exportez le service pour qu'il puisse être injecté ailleurs
})
export class MailModule {}