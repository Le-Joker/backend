import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { TestFormateur } from './test-formateur.entity';
import { Chantier } from './chantier.entity';
import { Devis } from './devis.entity';
import { Formation } from './formation.entity';

export enum Role {
  ADMIN = 'ADMIN',
  FORMATEUR = 'FORMATEUR',
  ETUDIANT = 'ETUDIANT',
  CLIENT = 'CLIENT',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hash bcrypt

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.ETUDIANT,
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => TestFormateur, (test) => test.user, { cascade: true })
  testFormateur: TestFormateur;

  @OneToMany(() => Chantier, (chantier) => chantier.client)
  chantiers: Chantier[];

  @OneToMany(() => Devis, (devis) => devis.client)
  devis: Devis[];

  @OneToMany(() => Formation, (formation) => formation.formateur)
  formations: Formation[];
}