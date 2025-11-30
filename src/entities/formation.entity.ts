import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Module } from './module.entity';

export enum FormationLevel {
  DEBUTANT = 'DEBUTANT',
  INTERMEDIAIRE = 'INTERMEDIAIRE',
  AVANCE = 'AVANCE',
}

export enum FormationStatus {
  BROUILLON = 'BROUILLON',
  PUBLIEE = 'PUBLIEE',
  ARCHIVEE = 'ARCHIVEE',
}

@Entity('formations')
export class Formation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titre: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  image: string; // URL de l'image de couverture

  @Column()
  duree: number; // Durée en heures

  @Column({
    type: 'enum',
    enum: FormationLevel,
    default: FormationLevel.DEBUTANT,
  })
  niveau: FormationLevel;

  @Column({
    type: 'enum',
    enum: FormationStatus,
    default: FormationStatus.BROUILLON,
  })
  status: FormationStatus;

  @Column({ default: 0 })
  nombreInscrits: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  noteAverage: number; // Note moyenne sur 5

  @Column({ default: 0 })
  nombreAvis: number;

  @Column()
  formateurId: string;

  @ManyToOne(() => User, (user) => user.formations)
  @JoinColumn({ name: 'formateurId' })
  formateur: User;

  @OneToMany(() => Module, (module) => module.formation, { cascade: true })
  modules: Module[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}