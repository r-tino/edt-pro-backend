// src/mail/mail.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer'; // Pour le typage de Nodemailer
import { ConfigService } from '@nestjs/config'; // Importez ConfigService

@Injectable()
export class MailService {
  private transporter: Mail;

  constructor(private configService: ConfigService) {
    // Créez le transporteur Nodemailer lors de l'initialisation du service
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<number>('MAIL_PORT') === 465, // True si port 465 (SSL), false sinon (TLS/STARTTLS)
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false // Accepter les certificats auto-signés en dev (à retirer en prod ou bien configurer correctement)
      }
    });
  }

  /**
   * Envoie un e-mail de réinitialisation de mot de passe.
   * @param to L'adresse e-mail du destinataire.
   * @param token Le jeton de réinitialisation.
   * @param userName Le nom de l'utilisateur.
   */
  async sendPasswordResetEmail(to: string, token: string, userName: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(to)}&token=${encodeURIComponent(token)}`;
    const mailFrom = this.configService.get<string>('MAIL_FROM') || 'no-reply@example.com';

    try {
      await this.transporter.sendMail({
        from: `"Votre Application" <${mailFrom}>`, // Expéditeur
        to: to, // Destinataire
        subject: 'Réinitialisation de votre mot de passe', // Sujet
        html: `
          <p>Bonjour ${userName},</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte sur notre application.</p>
          <p>Veuillez cliquer sur le lien suivant pour procéder à la réinitialisation :</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.</p>
          <p>Cordialement,</p>
          <p>L'équipe de votre application</p>
        `,
      });
      console.log(`Email de réinitialisation envoyé à ${to}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail de réinitialisation:', error);
      throw new InternalServerErrorException('Impossible d\'envoyer l\'e-mail de réinitialisation du mot de passe.');
    }
  }

  // Vous pouvez ajouter d'autres méthodes pour envoyer différents types d'e-mails ici
  // async sendWelcomeEmail(to: string, userName: string): Promise<void> { /* ... */ }
}
