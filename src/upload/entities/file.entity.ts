import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string; // Nom du fichier sur le serveur (avec UUID)

  @Column()
  originalName: string; // Nom original du fichier

  @Column()
  mimetype: string; // Type MIME (image/jpeg, video/mp4, etc.)

  @Column({ type: 'bigint' })
  size: number; // Taille en bytes

  @Column()
  path: string; // Chemin complet du fichier

  @Column()
  url: string; // URL publique pour accéder au fichier

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER,
  })
  type: FileType;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}