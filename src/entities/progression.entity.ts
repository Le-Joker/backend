import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Lesson } from './lesson.entity';

@Entity('progressions')
export class Progression {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  etudiantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'etudiantId' })
  etudiant: User;

  @Column()
  lessonId: string;

  @ManyToOne(() => Lesson)
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'int', default: 0 })
  tempsVisionne: number; // En secondes

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number; // Pour les quiz

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}