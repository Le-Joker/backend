import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscription, InscriptionStatus } from '../entities/inscription.entity';
import { Progression } from '../entities/progression.entity';
import { Formation } from '../entities/formation.entity';
import { User, Role } from '../entities/user.entity';

@Injectable()
export class InscriptionsService {
  constructor(
    @InjectRepository(Inscription)
    private inscriptionRepository: Repository<Inscription>,
    @InjectRepository(Progression)
    private progressionRepository: Repository<Progression>,
    @InjectRepository(Formation)
    private formationRepository: Repository<Formation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ==========================================
  // INSCRIPTIONS
  // ==========================================

  async inscrire(etudiantId: string, formationId: string): Promise<Inscription> {
    // Vérifier que l'étudiant existe
    const etudiant = await this.userRepository.findOne({
      where: { id: etudiantId, role: Role.ETUDIANT },
    });

    if (!etudiant) {
      throw new NotFoundException('Étudiant non trouvé');
    }

    // Vérifier que la formation existe
    const formation = await this.formationRepository.findOne({
      where: { id: formationId },
    });

    if (!formation) {
      throw new NotFoundException('Formation non trouvée');
    }

    // Vérifier que l'étudiant n'est pas déjà inscrit
    const existingInscription = await this.inscriptionRepository.findOne({
      where: { etudiantId, formationId },
    });

    if (existingInscription) {
      throw new ConflictException('Étudiant déjà inscrit à cette formation');
    }

    const inscription = this.inscriptionRepository.create({
      etudiantId,
      formationId,
      dateInscription: new Date(),
      progression: 0,
      modulesCompletes: [],
    });

    // Incrémenter le nombre d'inscrits
    formation.nombreInscrits += 1;
    await this.formationRepository.save(formation);

    return this.inscriptionRepository.save(inscription);
  }

  async findByFormateur(formateurId: string): Promise<Inscription[]> {
    return this.inscriptionRepository
      .createQueryBuilder('inscription')
      .leftJoinAndSelect('inscription.etudiant', 'etudiant')
      .leftJoinAndSelect('inscription.formation', 'formation')
      .where('formation.formateurId = :formateurId', { formateurId })
      .orderBy('inscription.createdAt', 'DESC')
      .getMany();
  }

  async findByEtudiant(etudiantId: string): Promise<Inscription[]> {
    return this.inscriptionRepository.find({
      where: { etudiantId },
      relations: ['formation', 'formation.formateur'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Inscription> {
    const inscription = await this.inscriptionRepository.findOne({
      where: { id },
      relations: ['etudiant', 'formation', 'formation.modules'],
    });

    if (!inscription) {
      throw new NotFoundException('Inscription non trouvée');
    }

    return inscription;
  }

  async updateProgression(
    inscriptionId: string,
    progression: number,
    modulesCompletes?: string[],
  ): Promise<Inscription> {
    const inscription = await this.findOne(inscriptionId);

    inscription.progression = progression;

    if (modulesCompletes) {
      inscription.modulesCompletes = modulesCompletes;
    }

    // Si progression = 100%, marquer comme terminée
    if (progression >= 100 && inscription.statut !== InscriptionStatus.TERMINEE) {
      inscription.statut = InscriptionStatus.TERMINEE;
      inscription.dateCompletion = new Date();
    }

    return this.inscriptionRepository.save(inscription);
  }

  async updateStatut(
    inscriptionId: string,
    statut: InscriptionStatus,
  ): Promise<Inscription> {
    const inscription = await this.findOne(inscriptionId);
    inscription.statut = statut;

    if (statut === InscriptionStatus.TERMINEE && !inscription.dateCompletion) {
      inscription.dateCompletion = new Date();
    }

    return this.inscriptionRepository.save(inscription);
  }

  async remove(inscriptionId: string): Promise<void> {
    const inscription = await this.findOne(inscriptionId);

    // Décrémenter le nombre d'inscrits
    const formation = await this.formationRepository.findOne({
      where: { id: inscription.formationId },
    });

    if (formation && formation.nombreInscrits > 0) {
      formation.nombreInscrits -= 1;
      await this.formationRepository.save(formation);
    }

    await this.inscriptionRepository.remove(inscription);
  }

  // ==========================================
  // PROGRESSIONS
  // ==========================================

  async markLessonComplete(
    etudiantId: string,
    lessonId: string,
    tempsVisionne?: number,
    score?: number,
  ): Promise<Progression> {
    let progression = await this.progressionRepository.findOne({
      where: { etudiantId, lessonId },
    });

    if (!progression) {
      progression = this.progressionRepository.create({
        etudiantId,
        lessonId,
      });
    }

    progression.isCompleted = true;
    progression.completedAt = new Date();

    if (tempsVisionne !== undefined) {
      progression.tempsVisionne = tempsVisionne;
    }

    if (score !== undefined) {
      progression.score = score;
    }

    return this.progressionRepository.save(progression);
  }

  async getProgressions(etudiantId: string, formationId: string) {
    return this.progressionRepository
      .createQueryBuilder('progression')
      .leftJoinAndSelect('progression.lesson', 'lesson')
      .leftJoinAndSelect('lesson.module', 'module')
      .where('progression.etudiantId = :etudiantId', { etudiantId })
      .andWhere('module.formationId = :formationId', { formationId })
      .getMany();
  }

  // ==========================================
  // STATISTIQUES FORMATEUR
  // ==========================================

  async getStatisticsFormateur(formateurId: string) {
    // Récupérer toutes les formations du formateur
    const formations = await this.formationRepository.find({
      where: { formateurId },
      relations: ['modules', 'modules.lessons'],
    });

    // Récupérer toutes les inscriptions
    const inscriptions = await this.findByFormateur(formateurId);

    // Statistiques générales
    const totalEtudiants = new Set(inscriptions.map((i) => i.etudiantId)).size;
    const totalInscriptions = inscriptions.length;
    const inscriptionsActives = inscriptions.filter(
      (i) => i.statut === InscriptionStatus.EN_COURS,
    ).length;
    const inscriptionsTerminees = inscriptions.filter(
      (i) => i.statut === InscriptionStatus.TERMINEE,
    ).length;

    // Taux de complétion moyen
    const progressionMoyenne =
      inscriptions.length > 0
        ? inscriptions.reduce((acc, i) => acc + i.progression, 0) /
          inscriptions.length
        : 0;

    // Formations les plus populaires
    const formationsPopulaires = formations
      .sort((a, b) => b.nombreInscrits - a.nombreInscrits)
      .slice(0, 5)
      .map((f) => ({
        id: f.id,
        titre: f.titre,
        nombreInscrits: f.nombreInscrits,
      }));

    return {
      totalFormations: formations.length,
      totalEtudiants,
      totalInscriptions,
      inscriptionsActives,
      inscriptionsTerminees,
      progressionMoyenne: Math.round(progressionMoyenne),
      tauxCompletion: totalInscriptions > 0 
        ? Math.round((inscriptionsTerminees / totalInscriptions) * 100)
        : 0,
      formationsPopulaires,
    };
  }

  async getEtudiantsParFormation(formationId: string) {
    return this.inscriptionRepository.find({
      where: { formationId },
      relations: ['etudiant'],
      order: { createdAt: 'DESC' },
    });
  }
}