import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormationsService } from './formations.service';
import { FormationsController } from './formations.controller';
import { Formation } from '../entities/formation.entity';
import { Module as ModuleEntity } from '../entities/module.entity';
import { Lesson } from '../entities/lesson.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Formation, ModuleEntity, Lesson])],
  controllers: [FormationsController],
  providers: [FormationsService],
  exports: [FormationsService],
})
export class FormationsModule {}