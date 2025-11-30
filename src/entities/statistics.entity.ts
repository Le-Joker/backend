import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('statistics')
export class Statistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 0 })
  totalUsers: number;

  @Column({ default: 0 })
  totalProjets: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  satisfactionRate: number; // Taux de satisfaction (en %)

  @Column({ default: 0 })
  totalFormations: number;

  @UpdateDateColumn()
  updatedAt: Date;
}