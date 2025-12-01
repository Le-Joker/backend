import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chantier, ChantierStatus } from '../entities/chantier.entity';
import { ChantierUpdate } from '../entities/chantier-update.entity';
import {
  CreateChantierDto,
  UpdateChantierDto,
  CreateChantierUpdateDto,
} from './dto/create-chantier.dto';

@Injectable()
export class ChantiersService {
  constructor(
    @InjectRepository(Chantier)
    private chantierRepository: Repository<Chantier>,
    @InjectRepository(ChantierUpdate)
    private chantierUpdateRepository: Repository<ChantierUpdate>,
  ) {}

  async create(
    createChantierDto: CreateChantierDto,
    clientId: string,
  ): Promise<Chantier> {
    const chantier = this.chantierRepository.create({
      ...createChantierDto,
      clientId,
      statut: ChantierStatus.EN_ATTENTE,
      progression: 0,
    });

    return this.chantierRepository.save(chantier);
  }

  async findAll(clientId?: string, statut?: ChantierStatus): Promise<Chantier[]> {
    const query = this.chantierRepository
      .createQueryBuilder('chantier')
      .leftJoinAndSelect('chantier.client', 'client')
      .leftJoinAndSelect('chantier.updates', 'updates')
      .orderBy('chantier.createdAt', 'DESC')
      .addOrderBy('updates.createdAt', 'DESC');

    if (clientId) {
      query.where('chantier.clientId = :clientId', { clientId });
    }

    if (statut) {
      query.andWhere('chantier.statut = :statut', { statut });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Chantier> {
    const chantier = await this.chantierRepository.findOne({
      where: { id },
      relations: ['client', 'updates'],
      order: {
        updates: {
          createdAt: 'DESC',
        },
      },
    });

    if (!chantier) {
      throw new NotFoundException('Chantier non trouvé');
    }

    return chantier;
  }

  async update(
    id: string,
    updateChantierDto: UpdateChantierDto,
    userId: string,
  ): Promise<Chantier> {
    const chantier = await this.findOne(id);

    if (chantier.clientId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres chantiers',
      );
    }

    Object.assign(chantier, updateChantierDto);
    return this.chantierRepository.save(chantier);
  }

  async updateStatut(id: string, statut: ChantierStatus): Promise<Chantier> {
    const chantier = await this.findOne(id);
    chantier.statut = statut;

    if (statut === ChantierStatus.TERMINE) {
      chantier.progression = 100;
      chantier.dateFin = new Date();
    }

    return this.chantierRepository.save(chantier);
  }

  async remove(id: string, userId: string): Promise<void> {
    const chantier = await this.findOne(id);

    if (chantier.clientId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres chantiers',
      );
    }

    await this.chantierRepository.remove(chantier);
  }

  // ==========================================
  // GESTION DES MISES À JOUR DE CHANTIER
  // ==========================================

  async createUpdate(
    chantierId: string,
    createUpdateDto: CreateChantierUpdateDto,
  ): Promise<ChantierUpdate> {
    const chantier = await this.findOne(chantierId);

    const update = this.chantierUpdateRepository.create({
      ...createUpdateDto,
      chantierId,
    });

    const savedUpdate = await this.chantierUpdateRepository.save(update);

    // Mettre à jour la progression du chantier si spécifiée
    if (createUpdateDto.progression !== undefined) {
      chantier.progression = createUpdateDto.progression;
      
      // Si progression = 100%, marquer comme terminé
      if (createUpdateDto.progression === 100) {
        chantier.statut = ChantierStatus.TERMINE;
      } else if (chantier.statut === ChantierStatus.EN_ATTENTE) {
        chantier.statut = ChantierStatus.EN_COURS;
      }

      await this.chantierRepository.save(chantier);
    }

    return savedUpdate;
  }

  async getUpdates(chantierId: string): Promise<ChantierUpdate[]> {
    return this.chantierUpdateRepository.find({
      where: { chantierId },
      order: { createdAt: 'DESC' },
    });
  }

  async removeUpdate(updateId: string): Promise<void> {
    const update = await this.chantierUpdateRepository.findOne({
      where: { id: updateId },
    });

    if (!update) {
      throw new NotFoundException('Mise à jour non trouvée');
    }

    await this.chantierUpdateRepository.remove(update);
  }

  async getStatistics(clientId?: string) {
    const query = this.chantierRepository.createQueryBuilder('chantier');

    if (clientId) {
      query.where('chantier.clientId = :clientId', { clientId });
    }

    const total = await query.getCount();
    const enCours = await query
      .clone()
      .andWhere('chantier.statut = :statut', { statut: ChantierStatus.EN_COURS })
      .getCount();
    const termine = await query
      .clone()
      .andWhere('chantier.statut = :statut', { statut: ChantierStatus.TERMINE })
      .getCount();
    const enPause = await query
      .clone()
      .andWhere('chantier.statut = :statut', { statut: ChantierStatus.EN_PAUSE })
      .getCount();

    return {
      total,
      enCours,
      termine,
      enPause,
    };
  }
}