import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { User } from '../entities/user.entity';
import { Testimonial } from '../entities/testimonial.entity';
import { Statistics } from '../entities/statistics.entity';
import { Chantier } from '../entities/chantier.entity';
import { Formation } from '../entities/formation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Testimonial,
      Statistics,
      Chantier,
      Formation,
    ]),
  ],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}