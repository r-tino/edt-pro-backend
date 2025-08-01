// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
// import { LoginUserDto } from './dto/login-user.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { MailService } from 'src/mail/mail.service'; // <-- Importez le MailService

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService, // <-- Injectez le MailService
  ) {}

  /**
   * Enregistre un nouvel utilisateur avec un rôle spécifique et crée le profil associé (Étudiant/Enseignant).
   * Gère également l'association des matières pour l'enseignant.
   * @param registerUserDto Les données d'inscription de l'utilisateur.
   * @returns Un message de succès après l'enregistrement.
   */
  async register(registerUserDto: RegisterUserDto) {
    const { nom, email, motDePasse, role, etudiantProfile, enseignantProfile } = registerUserDto;

    if (role === Role.ADMIN) {
      throw new ForbiddenException("Le rôle ADMIN ne peut pas être choisi lors de l'inscription.");
    }

    let createdUser; // Déclarez createdUser ici pour qu'il soit accessible dans le bloc catch
    try {
      const existingUser = await this.prisma.utilisateur.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà.');
      }

      const hashedPassword = await bcrypt.hash(motDePasse, 10);

      createdUser = await this.prisma.utilisateur.create({
        data: {
          nom,
          email,
          motDePasse: hashedPassword,
          role,
        },
      });

      if (role === Role.ETUDIANT) {
        if (!etudiantProfile || !etudiantProfile.niveauId) {
          throw new BadRequestException("Les informations de profil Étudiant (niveauId) sont requises.");
        }

        const niveauExists = await this.prisma.niveau.findUnique({
          where: { id: etudiantProfile.niveauId },
        });
        if (!niveauExists) {
          throw new NotFoundException(`Le niveau avec l'ID "${etudiantProfile.niveauId}" n'existe pas.`);
        }

        if (etudiantProfile.matricule) {
          const existingMatriculeEtudiant = await this.prisma.etudiant.findUnique({
            where: { matricule: etudiantProfile.matricule },
          });
          if (existingMatriculeEtudiant) {
            throw new ConflictException(`Le matricule "${etudiantProfile?.matricule}" est déjà utilisé.`);
          }
        }

        await this.prisma.etudiant.create({
          data: {
            utilisateurId: createdUser.id,
            matricule: etudiantProfile.matricule || null,
            niveauId: etudiantProfile.niveauId,
          },
        });
      } else if (role === Role.ENSEIGNANT) {
        if (!enseignantProfile) {
          throw new BadRequestException("Les informations de profil Enseignant sont requises.");
        }

        const createdEnseignant = await this.prisma.enseignant.create({
          data: {
            utilisateurId: createdUser.id,
            poste: enseignantProfile.poste || null,
          },
        });

        // Gérer les matières enseignées avec les niveaux
        if (enseignantProfile.matieresNiveaux && enseignantProfile.matieresNiveaux.length > 0) {
          // Vérifier si toutes les matières et niveaux existent
          for (const { matiereId, niveauId } of enseignantProfile.matieresNiveaux) {
            const matiereNiveauExists = await this.prisma.matiere.findUnique({
              where: { id: matiereId, niveauId: niveauId },
            });
            if (!matiereNiveauExists) {
              throw new BadRequestException(
                `La matière avec l'ID "${matiereId}" n'existe pas pour le niveau "${niveauId}".`,
              );
            }
          }

          await this.prisma.enseignantMatiere.createMany({
            data: enseignantProfile.matieresNiveaux.map(({ matiereId }) => ({
              enseignantId: createdEnseignant.id,
              matiereId: matiereId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return { message: 'Utilisateur enregistré avec succès. Veuillez vous connecter.' };
    } catch (error) {
      if (createdUser && (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException || error instanceof ForbiddenException)) {
        await this.prisma.utilisateur.delete({ where: { id: createdUser.id } });
      }
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          if (error.meta?.target === 'email') {
            throw new ConflictException(`L'email "${email}" est déjà utilisé.`);
          }
          if (error.meta?.target === 'matricule' && role === Role.ETUDIANT) {
            throw new ConflictException(`Le matricule "${etudiantProfile?.matricule}" est déjà utilisé.`);
          }
        }
      }
      console.error("Erreur lors de l'enregistrement de l'utilisateur:", error);
      throw new InternalServerErrorException(
        "Erreur interne du serveur lors de l'enregistrement de l'utilisateur.",
      );
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const passwordValid = await bcrypt.compare(password, user.motDePasse);
    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { motDePasse, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const fullUser = await this.prisma.utilisateur.findUnique({
      where: { id: user.id },
      include: {
        etudiant: {
          include: { niveau: { include: { departement: true } } },
        },
        enseignant: {
          include: {
            matieres: {
              include: { matiere: { include: { niveau: true } } },
            },
          },
        },
      },
    });

    if (!fullUser) {
      throw new UnauthorizedException(
        "Informations utilisateur complètes introuvables après authentification.",
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { motDePasse, ...userWithoutPassword } = fullUser;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async findById(id: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      include: {
        etudiant: {
          include: { niveau: { include: { departement: true } } },
        },
        enseignant: {
          include: {
            matieres: {
              include: { matiere: { include: { niveau: true } } },
            },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable.`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { motDePasse, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Gère la demande de réinitialisation de mot de passe.
   * Génère un jeton unique, le stocke en base de données et envoie un e-mail à l'utilisateur.
   * @param requestPasswordResetDto Le DTO contenant l'adresse e-mail de l'utilisateur.
   * @returns Un message de confirmation générique pour des raisons de sécurité.
   */
  async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto) {
    const { email } = requestPasswordResetDto;

    const user = await this.prisma.utilisateur.findUnique({ where: { email } });
    if (!user) {
      // Pour des raisons de sécurité, ne pas indiquer si l'email existe ou non.
      return { message: 'Si un compte est associé à cette adresse e-mail, un lien de réinitialisation vous a été envoyé.' };
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const crypto = await import('crypto');
    const token = crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Appel au service d'e-mail pour envoyer le lien de réinitialisation
    await this.mailService.sendPasswordResetEmail(user.email, token, user.nom); // <-- Appel réel
    console.log(`Lien de réinitialisation envoyé à ${user.email} (via service d'email).`); // Garde un log pour le débogage

    return { message: 'Si un compte est associé à cette adresse e-mail, un lien de réinitialisation vous a été envoyé.' };
  }

  /**
   * Réinitialise le mot de passe de l'utilisateur après validation du jeton.
   * @param resetPasswordDto Les données de réinitialisation (email, jeton, nouveau mot de passe).
   * @returns Un message de succès.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, token, newPassword } = resetPasswordDto;

    const user = await this.prisma.utilisateur.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Adresse e-mail invalide ou introuvable.');
    }

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: token },
    });

    if (!resetToken || resetToken.userId !== user.id) {
      throw new BadRequestException('Jeton de réinitialisation invalide ou déjà utilisé.');
    }

    if (resetToken.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new BadRequestException('Jeton de réinitialisation expiré.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { motDePasse: hashedPassword },
    });

    await this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    return { message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.' };
  }
}