import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Testimonial } from '../entities/testimonial.entity';
import { Statistics } from '../entities/statistics.entity';
import { Chantier } from '../entities/chantier.entity';
import { Formation } from '../entities/formation.entity';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Testimonial)
    private testimonialRepository: Repository<Testimonial>,
    @InjectRepository(Statistics)
    private statisticsRepository: Repository<Statistics>,
    @InjectRepository(Chantier)
    private chantierRepository: Repository<Chantier>,
    @InjectRepository(Formation)
    private formationRepository: Repository<Formation>,
  ) {}

  // ========================================
  // STATISTIQUES DYNAMIQUES
  // ========================================
  async getStatistics() {
    // Compter les utilisateurs actifs
    const totalUsers = await this.userRepository.count({
      where: { isActive: true },
    });

    // Compter les chantiers (projets)
    const totalProjets = await this.chantierRepository.count();

    // Compter les formations
    const totalFormations = await this.formationRepository.count();

    // Calculer le taux de satisfaction (moyenne des notes des témoignages)
    const testimonials = await this.testimonialRepository.find({
      where: { isApproved: true, isVisible: true },
    });

    const satisfactionRate =
      testimonials.length > 0
        ? (testimonials.reduce((acc, t) => acc + t.note, 0) / testimonials.length / 5) * 100
        : 98; // Valeur par défaut

    // Mettre à jour ou créer les stats
    let stats = await this.statisticsRepository.findOne({ where: {} });

    if (!stats) {
      stats = this.statisticsRepository.create({
        totalUsers,
        totalProjets,
        satisfactionRate: Math.round(satisfactionRate),
        totalFormations,
      });
    } else {
      stats.totalUsers = totalUsers;
      stats.totalProjets = totalProjets;
      stats.satisfactionRate = Math.round(satisfactionRate);
      stats.totalFormations = totalFormations;
    }

    await this.statisticsRepository.save(stats);

    return {
      professionnels: totalUsers,
      projets: totalProjets,
      satisfaction: Math.round(satisfactionRate),
      formations: totalFormations,
    };
  }

  // ========================================
  // TÉMOIGNAGES
  // ========================================
  async getTestimonials() {
    const testimonials = await this.testimonialRepository.find({
      where: { isApproved: true, isVisible: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 6, // Limiter à 6 témoignages
    });

    return testimonials.map((t) => ({
      id: t.id,
      contenu: t.contenu,
      note: t.note,
      userName: `${t.user.prenom} ${t.user.nom}`,
      userRole: t.user.role,
      createdAt: t.createdAt,
    }));
  }

  // Créer un témoignage (utilisateur connecté uniquement)
  async createTestimonial(userId: string, contenu: string, note: number) {
    // Vérifier si l'utilisateur a déjà un témoignage
    const existing = await this.testimonialRepository.findOne({
      where: { userId },
    });

    if (existing) {
      // Mettre à jour le témoignage existant
      existing.contenu = contenu;
      existing.note = note;
      existing.isApproved = false; // Nécessite une nouvelle approbation
      await this.testimonialRepository.save(existing);
      return existing;
    }

    const testimonial = this.testimonialRepository.create({
      userId,
      contenu,
      note,
      isApproved: false, // À approuver par un admin
    });

    await this.testimonialRepository.save(testimonial);
    return testimonial;
  }

  // Approuver un témoignage (Admin uniquement)
  async approveTestimonial(testimonialId: string) {
    const testimonial = await this.testimonialRepository.findOne({
      where: { id: testimonialId },
    });

    if (!testimonial) {
      throw new Error('Témoignage introuvable');
    }

    testimonial.isApproved = true;
    await this.testimonialRepository.save(testimonial);
    return testimonial;
  }
}