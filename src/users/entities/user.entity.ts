import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum UserRole {
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

  @Column({ nullable: true })
  password: string; // Nullable pour OAuth

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ETUDIANT,
  })
  role: UserRole;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: true })
  isActive: boolean;

  // Pour le test formateur
  @Column({ default: false })
  testPassed: boolean;

  @Column({ nullable: true, type: 'float' })
  testScore: number;

  @Column({ nullable: true })
  testAttempts: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations (à ajouter selon vos besoins)
  // @OneToMany(() => Formation, formation => formation.formateur)
  // formations: Formation[];

  // @OneToMany(() => Inscription, inscription => inscription.etudiant)
  // inscriptions: Inscription[];

  // @OneToMany(() => Devis, devis => devis.client)
  // devis: Devis[];
}