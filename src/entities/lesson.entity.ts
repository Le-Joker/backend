import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Module } from './module.entity';

export enum LessonType {
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  QUIZ = 'QUIZ',
  TEXTE = 'TEXTE',
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titre: string;

  @Column('text', { nullable: true })
  contenu: string; // Contenu texte de la leçon

  @Column({
    type: 'enum',
    enum: LessonType,
    default: LessonType.TEXTE,
  })
  type: LessonType;

  @Column({ nullable: true })
  videoUrl: string; // URL de la vidéo

  @Column({ nullable: true })
  documentUrl: string; // URL du document PDF

  @Column({ default: 0 })
  duree: number; // Durée en minutes

  @Column()
  ordre: number; // Ordre d'affichage dans le module

  @Column({ default: false })
  isPreview: boolean; // Accessible en preview sans inscription

  @Column()
  moduleId: string;

  @ManyToOne(() => Module, (module) => module.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moduleId' })
  module: Module;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}