import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Formation } from './formation.entity';

export enum InscriptionStatus {
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  ABANDONNEE = 'ABANDONNEE',
}

@Entity('inscriptions')
export class Inscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  etudiantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'etudiantId' })
  etudiant: User;

  @Column()
  formationId: string;

  @ManyToOne(() => Formation)
  @JoinColumn({ name: 'formationId' })
  formation: Formation;

  @Column({
    type: 'enum',
    enum: InscriptionStatus,
    default: InscriptionStatus.EN_COURS,
  })
  statut: InscriptionStatus;

  @Column({ type: 'int', default: 0 })
  progression: number; // Progression en %

  @Column({ type: 'jsonb', nullable: true })
  modulesCompletes: string[]; // IDs des modules terminés

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  note: number; // Note finale sur 20

  @Column({ nullable: true })
  dateInscription: Date;

  @Column({ nullable: true })
  dateCompletion: Date;

  @Column({ type: 'int', default: 0 })
  tempsTotal: number; // Temps passé en minutes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}