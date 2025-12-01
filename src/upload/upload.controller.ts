import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import type { Response } from 'express';
import * as fs from 'fs';

// Configuration Multer
const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, callback: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|mp4|avi|mov|mp3|wav/;
  const extname = allowedTypes.test(
    file.originalname.toLowerCase().split('.').pop() || '',
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return callback(null, true);
  } else {
    callback(
      new BadRequestException(
        'Type de fichier non autorisé. Formats acceptés : images, PDF, documents Office, vidéos, audio',
      ),
    );
  }
};

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  // Upload un seul fichier
  @Post('single')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const savedFile = await this.uploadService.saveFile(file, user.id);

    return {
      id: savedFile.id,
      filename: savedFile.filename,
      url: this.uploadService.getFileUrl(savedFile.filepath),
      type: savedFile.type,
      size: savedFile.size,
    };
  }

  // Upload plusieurs fichiers
  @Post('multiple')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage,
      fileFilter,
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: User,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const savedFiles = await Promise.all(
      files.map((file) => this.uploadService.saveFile(file, user.id)),
    );

    return savedFiles.map((file) => ({
      id: file.id,
      filename: file.filename,
      url: this.uploadService.getFileUrl(file.filepath),
      type: file.type,
      size: file.size,
    }));
  }

  // Récupérer tous les fichiers de l'utilisateur
  @Get('my-files')
  async getMyFiles(@CurrentUser() user: User) {
    const files = await this.uploadService.findAll(user.id);
    return files.map((file) => ({
      id: file.id,
      filename: file.filename,
      url: this.uploadService.getFileUrl(file.filepath),
      type: file.type,
      size: file.size,
      createdAt: file.createdAt,
    }));
  }

  // Télécharger un fichier
  @Get('download/:id')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.uploadService.getFile(id);
    
    res.download(file.filepath, file.filename);
  }

  // Supprimer un fichier
  @Delete(':id')
  async deleteFile(@Param('id') id: string, @CurrentUser() user: User) {
    await this.uploadService.deleteFile(id);
    return { message: 'Fichier supprimé avec succès' };
  }
}