import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Role } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // ========================================
  // INSCRIPTION
  // ========================================
  async register(registerDto: RegisterDto) {
    const { email, password, nom, prenom, telephone, role } = registerDto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      nom,
      prenom,
      telephone,
      role: role || Role.ETUDIANT,
    });

    await this.userRepository.save(user);

    // Générer le token JWT
    const token = this.generateToken(user);

    return {
      message: 'Inscription réussie',
      user: this.sanitizeUser(user),
      token,
    };
  }

  // ========================================
  // CONNEXION
  // ========================================
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Trouver l'utilisateur
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new UnauthorizedException('Votre compte est désactivé');
    }

    // Générer le token JWT
    const token = this.generateToken(user);

    return {
      message: 'Connexion réussie',
      user: this.sanitizeUser(user),
      token,
    };
  }

  // ========================================
  // VALIDATION JWT (utilisé par JwtStrategy)
  // ========================================
  async validateUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur non valide');
    }

    return user;
  }

  // ========================================
  // HELPERS
  // ========================================
  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  // Méthode publique pour générer un token (utilisée par Google OAuth)
  generateTokenForUser(user: User): string {
    return this.generateToken(user);
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}