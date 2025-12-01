import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Vos modules existants
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FormationsModule } from './formations/formations.module';
import { InscriptionsModule } from './inscriptions/inscriptions.module';
import { DevisModule } from './devis/devis.module';
import { ChantiersModule } from './chantiers/chantiers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { CertificatesModule } from './certificates/certificates.module';
import { UploadModule } from './upload/upload.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    // ==============================
    // Configuration
    // ==============================
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ==============================
    // 🔒 RATE LIMITING GLOBAL
    // ==============================
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 secondes
        limit: 100, // 100 requêtes max par minute
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 10, // Pour login/register
      },
    ]),

    // ==============================
    // Base de données
    // ==============================
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'intellect_building',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production', // ⚠️ false en prod
      logging: process.env.NODE_ENV === 'development',
    }),

    // ==============================
    // Modules métier
    // ==============================
    AuthModule,
    UsersModule,
    FormationsModule,
    InscriptionsModule,
    DevisModule,
    ChantiersModule,
    NotificationsModule,
    ChatModule,
    CertificatesModule,
    UploadModule,
    PublicModule,
  ],
  providers: [
    // ==============================
    // 🔒 Rate Limiting activé globalement
    // ==============================
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}