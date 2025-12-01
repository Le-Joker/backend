import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscriptionsService } from './inscriptions.service';
import { InscriptionsController } from './inscriptions.controller';
import { Inscription } from '../entities/inscription.entity';
import { Progression } from '../entities/progression.entity';
import { Formation } from '../entities/formation.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inscription, Progression, Formation, User]),
  ],
  controllers: [InscriptionsController],
  providers: [InscriptionsService],
  exports: [InscriptionsService],
})
export class InscriptionsModule {}