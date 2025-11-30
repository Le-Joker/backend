import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { TestFormateur } from './entities/test-formateur.entity';
import { Chantier } from './entities/chantier.entity';
import { Devis } from './entities/devis.entity';
import { Formation } from './entities/formation.entity';
import { Testimonial } from './entities/testimonial.entity';
import { Statistics } from './entities/statistics.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PublicModule } from './public/public.module';

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
      entities: [User, TestFormateur, Chantier, Devis, Formation, Testimonial, Statistics],
      synchronize: true, // ⚠️ Mettre à false en production !
      logging: true,
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