import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChantiersService } from './chantiers.service';
import { ChantiersController } from './chantiers.controller';
import { Chantier } from '../entities/chantier.entity';
import { ChantierUpdate } from '../entities/chantier-update.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chantier, ChantierUpdate])],
  controllers: [ChantiersController],
  providers: [ChantiersService],
  exports: [ChantiersService],
})
export class ChantiersModule {}