import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // ==============================
  // REGISTER
  // ==============================
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, role } = registerDto;

    // Vérifier si email existe déjà
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || UserRole.ETUDIANT,
      isActive: true,
    });

    await this.usersRepository.save(user);

    // Générer JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  // ==============================
  // LOGIN
  // ==============================
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Trouver l'utilisateur
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier si compte actif
    if (!user.isActive) {
      throw new UnauthorizedException('Votre compte est désactivé');
    }

    // Générer JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        testPassed: user.testPassed,
        testScore: user.testScore,
      },
    };
  }

  // ==============================
  // 🆕 GOOGLE LOGIN
  // ==============================
  async googleLogin(googleUser: any) {
    if (!googleUser) {
      throw new UnauthorizedException('Erreur lors de l\'authentification Google');
    }

    const { email, firstName, lastName, picture } = googleUser;

    // Chercher ou créer l'utilisateur
    let user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      // Créer un nouvel utilisateur depuis Google
      user = this.usersRepository.create({
        email,
        firstName,
        lastName,
        avatar: picture,
        password: '', // Pas de mot de passe pour OAuth
        role: UserRole.ETUDIANT, // Rôle par défaut
        isActive: true,
      });
      await this.usersRepository.save(user);
    }

    // Générer JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  // ==============================
  // VALIDATE USER (pour JWT Strategy)
  // ==============================
  async validateUser(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return user;
  }
}