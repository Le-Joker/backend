import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==============================
  // 🔒 REGISTER - Rate limit strict
  // ==============================
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // ==============================
  // 🔒 LOGIN - Rate limit strict
  // ==============================
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 tentatives par minute
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ==============================
  // GET CURRENT USER
  // ==============================
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      testPassed: user.testPassed,
      testScore: user.testScore,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  // ==============================
  // GOOGLE OAUTH
  // ==============================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirige vers Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const { access_token, user } = await this.authService.googleLogin(req.user);
    
    // Redirection vers frontend avec token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
  }
}