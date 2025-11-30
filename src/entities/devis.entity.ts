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

export enum DevisStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  ANNULE = 'ANNULE',
}

export enum DevisType {
  CONSTRUCTION = 'CONSTRUCTION',
  RENOVATION = 'RENOVATION',
  AMENAGEMENT = 'AMENAGEMENT',
  DEMOLITION = 'DEMOLITION',
  AUTRE = 'AUTRE',
}

@Entity('devis')
export class Devis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  titre: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: DevisType,
    default: DevisType.CONSTRUCTION,
  })
  type: DevisType;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  montant: number;

  @Column({
    type: 'enum',
    enum: DevisStatus,
    default: DevisStatus.EN_ATTENTE,
  })
  statut: DevisStatus;

  @Column()
  adresseChantier: string;

  @Column({ nullable: true })
  dateDebut: Date;

  @Column({ nullable: true })
  dateFinEstimee: Date;

  @Column('text', { nullable: true })
  commentaire: string;

  @Column()
  clientId: string;

  @ManyToOne(() => User, (user) => user.devis)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}