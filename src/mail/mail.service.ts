// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // ou ton fournisseur SMTP
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER, // <== Ton adresse email d'envoi (expéditeur)
        pass: process.env.SMTP_PASS, // <== Ton mot de passe (ou App Password Gmail)
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string, nom: string) {
    // email: celui de l'utilisateur qui a demandé le reset
    // token: généré pour cet utilisateur
    // nom: nom de l'utilisateur (pour personnaliser le mail)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from: `"EDT Pro" <${process.env.SMTP_USER}>`, // Expéditeur (ton email)
      to: email, // <== C'est l'email du user (récupéré depuis le champ saisi dans le formulaire)
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <h2>Bonjour ${nom},</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe sur EDT Pro.<br/>
        Cliquez sur le lien ci-dessous&nbsp;:</p>
        <p><a href="${resetUrl}" style="color:#2563eb;font-weight:bold;">Réinitialiser mon mot de passe</a></p>
        <p>Ce lien expirera dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      `
    });
  }
}