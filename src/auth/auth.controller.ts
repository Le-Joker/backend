import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  ValidationPipe,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  // ========================================
  // POST /auth/register
  // ========================================
  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // ========================================
  // POST /auth/login
  // ========================================
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ========================================
  // GET /auth/me (route protégée)
  // ========================================
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    const { password, ...result } = user;
    return result;
  }

  // ========================================
  // GOOGLE OAUTH
  // ========================================

  // GET /auth/google - Démarre le flux OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirige automatiquement vers Google
  }

  // GET /auth/google/callback - Callback après OAuth
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const user = req.user as User;

    // Générer le token JWT
    const token = this.authService.generateTokenForUser(user);

    // Rediriger vers le frontend avec le token
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
}