import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formation, FormationStatus } from '../entities/formation.entity';
import { Module as ModuleEntity } from '../entities/module.entity';
import { Lesson } from '../entities/lesson.entity';
import {
  CreateFormationDto,
  UpdateFormationDto,
  CreateModuleDto,
  CreateLessonDto,
} from './dto/create-formation.dto';

@Injectable()
export class FormationsService {
  constructor(
    @InjectRepository(Formation)
    private formationRepository: Repository<Formation>,
    @InjectRepository(ModuleEntity)
    private moduleRepository: Repository<ModuleEntity>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
  ) {}

  // ==========================================
  // FORMATIONS
  // ==========================================

  async create(
    createFormationDto: CreateFormationDto,
    formateurId: string,
  ): Promise<Formation> {
    const formation = this.formationRepository.create({
      ...createFormationDto,
      formateurId,
    });

    return this.formationRepository.save(formation);
  }

  async findAll(
    status?: FormationStatus,
  ): Promise<Formation[]> {
    const query = this.formationRepository
      .createQueryBuilder('formation')
      .leftJoinAndSelect('formation.formateur', 'formateur')
      .leftJoinAndSelect('formation.modules', 'modules')
      .orderBy('formation.createdAt', 'DESC');

    if (status) {
      query.where('formation.status = :status', { status });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Formation> {
    const formation = await this.formationRepository.findOne({
      where: { id },
      relations: ['formateur', 'modules', 'modules.lessons'],
    });

    if (!formation) {
      throw new NotFoundException('Formation non trouvée');
    }

    return formation;
  }

  async findByFormateur(formateurId: string): Promise<Formation[]> {
    return this.formationRepository.find({
      where: { formateurId },
      relations: ['modules'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateFormationDto: UpdateFormationDto,
    userId: string,
  ): Promise<Formation> {
    const formation = await this.findOne(id);

    if (formation.formateurId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres formations',
      );
    }

    Object.assign(formation, updateFormationDto);
    return this.formationRepository.save(formation);
  }

  async publish(id: string, userId: string): Promise<Formation> {
    const formation = await this.findOne(id);

    if (formation.formateurId !== userId) {
      throw new ForbiddenException('Action non autorisée');
    }

    formation.status = FormationStatus.PUBLIEE;
    return this.formationRepository.save(formation);
  }

  async remove(id: string, userId: string): Promise<void> {
    const formation = await this.findOne(id);

    if (formation.formateurId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres formations',
      );
    }

    await this.formationRepository.remove(formation);
  }

  // ==========================================
  // MODULES
  // ==========================================

  async createModule(
    formationId: string,
    createModuleDto: CreateModuleDto,
    userId: string,
  ): Promise<ModuleEntity> {
    const formation = await this.findOne(formationId);

    if (formation.formateurId !== userId) {
      throw new ForbiddenException('Action non autorisée');
    }

    const module = this.moduleRepository.create({
      ...createModuleDto,
      formationId,
    });

    return this.moduleRepository.save(module);
  }

  async updateModule(
    moduleId: string,
    updateData: Partial<CreateModuleDto>,
    userId: string,
  ): Promise<ModuleEntity> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['formation'],
    });

    if (!module) {
      throw new NotFoundException('Module non trouvé');
    }

    if (module.formation.formateurId !== userId) {
      throw new ForbiddenException('Action non autorisée');
    }

    Object.assign(module, updateData);
    return this.moduleRepository.save(module);
  }

  async removeModule(moduleId: string, userId: string): Promise<void> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['formation'],
    });

    if (!module) {
      throw new NotFoundException('Module non trouvé');
    }

    if (module.formation.formateurId !== userId) {
      throw new ForbiddenException('Action non autorisée');
    }

    await this.moduleRepository.remove(module);
  }

  // ==========================================
  // LESSONS
  // ==========================================

  async createLesson(
    moduleId: string,
    createLessonDto: CreateLessonDto,
    userId: string,
  ): Promise<Lesson> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['formation'],
    });

    if (!module) {
      throw new NotFoundException('Module non trouvé');
    }

    if (module.formation.formateurId !== userId) {
      throw new ForbiddenException('Action non autorisée');
    }

    const lesson = this.lessonRepository.create({
      ...createLessonDto,
      moduleId,
    });

    return this.lessonRepository.save(lesson);
  }

  async updateLesson(
    lessonId: string,
    updateData: Partial<CreateLessonDto>,
    userId: string,
  ): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.formation'],
    });

    if (!lesson) {
      throw new NotFoundException('Leçon non trouvée');
    }

    if (lesson.module.formation.formateurId !== userId) {
      throw new ForbiddenException('Action non autorisée');
    }

    Object.assign(lesson, updateData);
    return this.lessonRepository.save(lesson);
  }

  async removeLesson(lessonId: string, userId: string): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.formation'],
    });

    if (!lesson) {
      throw new NotFoundException('Leçon non trouvée');
    }

    if (lesson.module.formation.formateurId !== userId) {
      throw new ForbiddenException('Action non autorisée');
    }

    await this.lessonRepository.remove(lesson);
  }

  // ==========================================
  // STATISTIQUES
  // ==========================================

  async getStatistics() {
    const total = await this.formationRepository.count();
    const publiques = await this.formationRepository.count({
      where: { status: FormationStatus.PUBLIEE },
    });

    return {
      total,
      publiques,
      brouillons: total - publiques,
    };
  }
}