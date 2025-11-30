import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activer la validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Activer CORS pour permettre les requêtes du frontend
  app.enableCors({
    origin: 'http://localhost:3000', // Frontend Next.js
    credentials: true,
  });

  // Préfixe global pour toutes les routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`\n🚀 Serveur démarré sur http://localhost:${port}/api`);
  console.log(`📚 Routes disponibles :`);
  console.log(`   - POST http://localhost:${port}/api/auth/register`);
  console.log(`   - POST http://localhost:${port}/api/auth/login`);
  console.log(`   - GET  http://localhost:${port}/api/auth/me\n`);
}
bootstrap();