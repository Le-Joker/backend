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
import { Formation } from './formation.entity';
import { Lesson } from './lesson.entity';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titre: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  ordre: number; // Ordre d'affichage

  @Column()
  formationId: string;

  @ManyToOne(() => Formation, (formation) => formation.modules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formationId' })
  formation: Formation;

  @OneToMany(() => Lesson, (lesson) => lesson.module, { cascade: true })
  lessons: Lesson[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}