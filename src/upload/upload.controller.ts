import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UploadService } from './upload.service';
import { FileType } from './entities/file.entity';
import { 
  FileValidationPipe, 
  ImageValidationPipe,
  VideoValidationPipe,
  DocumentValidationPipe 
} from './pipes/file-validation.pipe';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

// ==============================
// Configuration Multer sécurisée
// ==============================
const multerOptions = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, callback) => {
      // Nom unique + extension originale
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (backup)
    files: 10, // Max 10 fichiers simultanés
  },
  fileFilter: (req, file, callback) => {
    // Liste noire d'extensions dangereuses
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.jsp'];
    const ext = extname(file.originalname).toLowerCase();
    
    if (dangerousExtensions.includes(ext)) {
      return callback(
        new BadRequestException(`Extension ${ext} non autorisée pour des raisons de sécurité`),
        false
      );
    }
    
    callback(null, true);
  },
};

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ==============================
  // Upload général (avec validation stricte)
  // ==============================
  @Post('single')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadSingle(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.uploadService.saveFile(file, user.id);
  }

  // ==============================
  // Upload multiple
  // ==============================
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadMultiple(
    @UploadedFiles(FileValidationPipe) files: Express.Multer.File[],
    @CurrentUser() user: User,
  ) {
    const uploadedFiles = await Promise.all(
      files.map((file) => this.uploadService.saveFile(file, user.id))
    );
    return { files: uploadedFiles };
  }

  // ==============================
  // Upload IMAGE uniquement
  // ==============================
  @Post('image')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadImage(
    @UploadedFile(ImageValidationPipe) file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.uploadService.saveFile(file, user.id, FileType.IMAGE);
  }

  // ==============================
  // Upload VIDÉO uniquement
  // ==============================
  @Post('video')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadVideo(
    @UploadedFile(VideoValidationPipe) file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.uploadService.saveFile(file, user.id, FileType.VIDEO);
  }

  // ==============================
  // Upload DOCUMENT uniquement
  // ==============================
  @Post('document')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadDocument(
    @UploadedFile(DocumentValidationPipe) file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.uploadService.saveFile(file, user.id, FileType.DOCUMENT);
  }

  // ==============================
  // Upload AVATAR (images petites)
  // ==============================
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      ...multerOptions,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max pour avatar
    })
  )
  async uploadAvatar(
    @UploadedFile(ImageValidationPipe) file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    // Supprimer l'ancien avatar si existe
    if (user.avatar) {
      await this.uploadService.deleteFile(user.avatar);
    }

    const uploadedFile = await this.uploadService.saveFile(file, user.id, FileType.IMAGE);
    
    // Mettre à jour l'avatar de l'utilisateur
    // TODO: Appeler UserService pour update avatar
    
    return uploadedFile;
  }
}