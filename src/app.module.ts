// src/app.module.ts - VERSION CORRIGÉE
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ✅ Entités
import { User } from './entities/user.entity';
import { TestFormateur } from './entities/test-formateur.entity';
import { Chantier } from './entities/chantier.entity';
import { ChantierUpdate } from './entities/chantier-update.entity';
import { Devis } from './entities/devis.entity';
import { Formation } from './entities/formation.entity';
import { Module as ModuleEntity } from './entities/module.entity';
import { Lesson } from './entities/lesson.entity';
import { Testimonial } from './entities/testimonial.entity';
import { Statistics } from './entities/statistics.entity';
import { Notification } from './entities/notification.entity';
import { File } from './entities/file.entity';

// ✅ Modules fonctionnels
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FormationsModule } from './formations/formations.module'; // ⚠️ À AJOUTER
import { DevisModule } from './devis/devis.module'; // ✅ CRÉÉ
import { ChantiersModule } from './chantiers/chantiers.module'; // ✅ CRÉÉ
import { PublicModule } from './public/public.module';
import { ChatModule } from './chat/chat.module';
import { InscriptionsModule } from './inscriptions/inscriptions.module';
import { CertificatesModule } from './certificates/certificates.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Base de données
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'intellect_building',
      entities: [
        User,
        TestFormateur,
        Chantier,
        ChantierUpdate,
        Devis,
        Formation,
        ModuleEntity,
        Lesson,
        Testimonial,
        Statistics,
        Notification,
        File,
      ],
      synchronize: true, // ⚠️ false en production
      logging: false,
    }),

    // ✅ Modules applicatifs
    AuthModule,
    UsersModule,
    FormationsModule,
    DevisModule,
    ChantiersModule,
    PublicModule,
    ChatModule,
    InscriptionsModule,
    CertificatesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}