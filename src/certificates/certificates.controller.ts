import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import type { Response } from 'express';
import * as path from 'path';

@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @Get('generate/:inscriptionId')
  async generateCertificate(
    @Param('inscriptionId') inscriptionId: string,
    @CurrentUser() user: User,
  ) {
    const certificatePath = await this.certificatesService.generateCertificate(inscriptionId);
    return {
      message: 'Certificat généré avec succès',
      url: certificatePath,
    };
  }

  @Get('download/:inscriptionId')
  async downloadCertificate(
    @Param('inscriptionId') inscriptionId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const certificatePath = await this.certificatesService.getCertificatePath(inscriptionId);
    const fullPath = path.join(process.cwd(), certificatePath);
    res.download(fullPath, `certificat-${inscriptionId}.pdf`);
  }
}