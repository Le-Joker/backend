import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from '../../entities/user.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    // Vérifier si l'utilisateur existe déjà
    let user = await this.userRepository.findOne({
      where: { email: emails[0].value },
    });

    if (!user) {
      // Créer un nouvel utilisateur
      user = this.userRepository.create({
        email: emails[0].value,
        nom: name.familyName || 'Google',
        prenom: name.givenName || 'User',
        password: '', // Pas de mot de passe pour OAuth
        role: Role.ETUDIANT, // Rôle par défaut
        isActive: true,
      });

      await this.userRepository.save(user);
    }

    done(null, user);
  }
}