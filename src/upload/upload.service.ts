import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileType } from '../entities/file.entity';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
  ) {}

  async saveFile(
    file: Express.Multer.File,
    userId?: string,
  ): Promise<File> {
    const fileType = this.getFileType(file.mimetype);

    const fileEntity = this.fileRepository.create({
      filename: file.originalname,
      filepath: file.path,
      mimetype: file.mimetype,
      size: file.size,
      type: fileType,
      uploadedById: userId,
    });

    return this.fileRepository.save(fileEntity);
  }

  // ✅ FIX : Ajouter la gestion du cas null
  async getFile(id: string): Promise<File> {
    const file = await this.fileRepository.findOne({ where: { id } });
    
    if (!file) {
      throw new NotFoundException(`Fichier avec l'ID ${id} non trouvé`);
    }
    
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.getFile(id); // Utilise getFile qui gère déjà le cas null
    
    // Supprimer le fichier physique
    try {
      await fs.unlink(file.filepath);
    } catch (error) {
      console.error('Erreur suppression fichier physique:', error);
    }

    // Supprimer de la base de données
    await this.fileRepository.remove(file);
  }

  private getFileType(mimetype: string): FileType {
    if (mimetype.startsWith('image/')) return FileType.IMAGE;
    if (mimetype.startsWith('video/')) return FileType.VIDEO;
    if (mimetype.startsWith('audio/')) return FileType.AUDIO;
    return FileType.DOCUMENT;
  }

  getFileUrl(filepath: string): string {
    return `/uploads/${path.basename(filepath)}`;
  }
}