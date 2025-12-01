import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { Inscription } from '../entities/inscription.entity';
import { User } from '../entities/user.entity';
import { Formation } from '../entities/formation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inscription, User, Formation])],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}