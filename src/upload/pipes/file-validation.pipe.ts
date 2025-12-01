import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly allowedMimeTypes: string[];
  private readonly maxSizeInBytes: number;

  constructor(options?: {
    allowedMimeTypes?: string[];
    maxSizeInMB?: number;
  }) {
    // Types MIME autorisés par défaut
    this.allowedMimeTypes = options?.allowedMimeTypes || [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      
      // Vidéos
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
    ];

    // Taille max en bytes (par défaut 50MB)
    const maxSizeMB = options?.maxSizeInMB || 50;
    this.maxSizeInBytes = maxSizeMB * 1024 * 1024;
  }

  transform(file: Express.Multer.File | Express.Multer.File[]) {
    // Si pas de fichier
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Si plusieurs fichiers
    if (Array.isArray(file)) {
      file.forEach((f) => this.validateSingleFile(f));
      return file;
    }

    // Si un seul fichier
    this.validateSingleFile(file);
    return file;
  }

  private validateSingleFile(file: Express.Multer.File) {
    // Vérifier l'extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension) {
      throw new BadRequestException('Extension de fichier invalide');
    }

    // Vérifier le type MIME
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé: ${file.mimetype}. Types autorisés: images, documents, vidéos, audio.`
      );
    }

    // Vérifier la taille
    if (file.size > this.maxSizeInBytes) {
      const maxSizeMB = this.maxSizeInBytes / (1024 * 1024);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `Fichier trop volumineux (${fileSizeMB}MB). Taille maximale: ${maxSizeMB}MB`
      );
    }

    // Vérifier le nom du fichier (pas de caractères dangereux)
    const dangerousPattern = /[<>:"|?*\x00-\x1f]/g;
    if (dangerousPattern.test(file.originalname)) {
      throw new BadRequestException(
        'Nom de fichier contient des caractères non autorisés'
      );
    }
  }
}

// ==============================
// Pipes prédéfinis pour types spécifiques
// ==============================

@Injectable()
export class ImageValidationPipe extends FileValidationPipe {
  constructor() {
    super({
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
      maxSizeInMB: 10, // 10MB pour images
    });
  }
}

@Injectable()
export class VideoValidationPipe extends FileValidationPipe {
  constructor() {
    super({
      allowedMimeTypes: [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/webm',
      ],
      maxSizeInMB: 100, // 100MB pour vidéos
    });
  }
}

@Injectable()
export class DocumentValidationPipe extends FileValidationPipe {
  constructor() {
    super({
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ],
      maxSizeInMB: 20, // 20MB pour documents
    });
  }
}