import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { TestFormateur } from './entities/test-formateur.entity';
import { Chantier } from './entities/chantier.entity';
import { ChantierUpdate } from './entities/chantier-update.entity'; // ✅ AJOUTER
import { Devis } from './entities/devis.entity';
import { Formation } from './entities/formation.entity';
import { Module as ModuleEntity } from './entities/module.entity'; // ✅ AJOUTER
import { Lesson } from './entities/lesson.entity'; // ✅ AJOUTER
import { Testimonial } from './entities/testimonial.entity';
import { Statistics } from './entities/statistics.entity';
import { Notification } from './entities/notification.entity'; // ✅ AJOUTER
import { File } from './entities/file.entity'; // ✅ AJOUTER
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PublicModule } from './public/public.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // Configuration des variables d'environnement
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configuration TypeORM
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
        ChantierUpdate, // ✅ AJOUTER
        Devis,
        Formation,
        ModuleEntity, // ✅ AJOUTER (attention au conflit avec le mot-clé Module)
        Lesson, // ✅ AJOUTER
        Testimonial,
        Statistics,
        Notification, // ✅ AJOUTER
        File, // ✅ AJOUTER
        ChatModule, // ✅ AJOUTER
      ],
      synchronize: true, // ⚠️ Mettre à false en production !
      logging: false, // ✅ Désactiver les logs SQL (facultatif)
    }),

    // Modules
    AuthModule,
    UsersModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}