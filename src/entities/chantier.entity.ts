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
import { ChantierUpdate } from './chantier-update.entity';

export enum ChantierStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
}

@Entity('chantiers')
export class Chantier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titre: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  adresse: string;

  @Column()
  dateDebut: Date;

  @Column({ nullable: true })
  dateFin: Date;

  @Column({
    type: 'enum',
    enum: ChantierStatus,
    default: ChantierStatus.EN_ATTENTE,
  })
  statut: ChantierStatus;

  @Column({ default: 0 })
  progression: number; // Progression en %

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  budget: number;

  @Column({ nullable: true })
  image: string; // Photo du chantier

  @Column()
  clientId: string;

  @ManyToOne(() => User, (user) => user.chantiers)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @OneToMany(() => ChantierUpdate, (update) => update.chantier, {
    cascade: true,
  })
  updates: ChantierUpdate[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}