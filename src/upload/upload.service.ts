import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileType } from './entities/file.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
  ) {}

  // ==============================
  // SAVE FILE (avec type optionnel)
  // ==============================
  async saveFile(
    file: Express.Multer.File,
    userId: string,
    fileType?: FileType,
  ) {
    // Déterminer le type automatiquement si non fourni
    let type = fileType;
    if (!type) {
      if (file.mimetype.startsWith('image/')) {
        type = FileType.IMAGE;
      } else if (file.mimetype.startsWith('video/')) {
        type = FileType.VIDEO;
      } else if (file.mimetype.startsWith('audio/')) {
        type = FileType.AUDIO;
      } else if (
        file.mimetype.includes('pdf') ||
        file.mimetype.includes('document') ||
        file.mimetype.includes('sheet')
      ) {
        type = FileType.DOCUMENT;
      } else {
        type = FileType.OTHER;
      }
    }

    // Créer l'entrée en base
    const fileEntity = this.fileRepository.create({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/${file.filename}`,
      type,
      uploadedBy: { id: userId } as any,
    });

    await this.fileRepository.save(fileEntity);

    return {
      id: fileEntity.id,
      filename: fileEntity.filename,
      originalName: fileEntity.originalName,
      mimetype: fileEntity.mimetype,
      size: fileEntity.size,
      url: fileEntity.url,
      type: fileEntity.type,
      createdAt: fileEntity.createdAt,
    };
  }

  // ==============================
  // DELETE FILE
  // ==============================
  async deleteFile(fileId: string) {
    const file = await this.fileRepository.findOne({ where: { id: fileId } });
    
    if (!file) {
      return { deleted: false, message: 'Fichier introuvable' };
    }

    // Supprimer le fichier physique
    try {
      const filePath = path.join(process.cwd(), file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier physique:', error);
    }

    // Supprimer l'entrée en base
    await this.fileRepository.remove(file);

    return { deleted: true, message: 'Fichier supprimé avec succès' };
  }

  // ==============================
  // GET USER FILES
  // ==============================
  async getUserFiles(userId: string, type?: string) {
    const query: any = { where: { uploadedBy: { id: userId } } };
    
    if (type) {
      query.where.type = type;
    }

    return this.fileRepository.find(query);
  }

  // ==============================
  // GET FILE BY ID
  // ==============================
  async getFileById(fileId: string) {
    return this.fileRepository.findOne({ where: { id: fileId } });
  }
}