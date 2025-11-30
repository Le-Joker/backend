import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Chantier } from './chantier.entity';

@Entity('chantier_updates')
export class ChantierUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titre: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  image: string; // Photo de l'avancement

  @Column({ nullable: true })
  progression: number; // Nouvelle progression en %

  @Column()
  chantierId: string;

  @ManyToOne(() => Chantier, (chantier) => chantier.updates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chantierId' })
  chantier: Chantier;

  @CreateDateColumn()
  createdAt: Date;
}