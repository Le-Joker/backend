import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ==============================
  // 🛡️ SÉCURITÉ : HELMET
  // ==============================
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Pour uploads/images
      contentSecurityPolicy: false, // Désactivé si vous servez du HTML
    })
  );

  // ==============================
  // CORS
  // ==============================
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // ==============================
  // Validation globale
  // ==============================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les props non déclarées
      forbidNonWhitelisted: true, // Rejette si props inconnues
      transform: true, // Transforme les types automatiquement
    })
  );

  // ==============================
  // Préfixe API global
  // ==============================
  app.setGlobalPrefix('api');

  // ==============================
  // Fichiers statiques (uploads)
  // ==============================
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Server running on http://localhost:${port}/api`);
}

bootstrap();