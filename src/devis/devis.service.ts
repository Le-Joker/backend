import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Devis, DevisStatus } from '../entities/devis.entity';
import { CreateDevisDto, UpdateDevisDto } from './dto/create-devis.dto';

@Injectable()
export class DevisService {
  constructor(
    @InjectRepository(Devis)
    private devisRepository: Repository<Devis>,
  ) {}

  async create(createDevisDto: CreateDevisDto, clientId: string): Promise<Devis> {
    // Générer une référence unique
    const year = new Date().getFullYear();
    const count = await this.devisRepository.count();
    const reference = `DEV-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const devis = this.devisRepository.create({
      ...createDevisDto,
      reference,
      clientId,
      statut: DevisStatus.EN_ATTENTE,
    });

    return this.devisRepository.save(devis);
  }

  async findAll(clientId?: string, statut?: DevisStatus): Promise<Devis[]> {
    const query = this.devisRepository
      .createQueryBuilder('devis')
      .leftJoinAndSelect('devis.client', 'client')
      .orderBy('devis.createdAt', 'DESC');

    if (clientId) {
      query.where('devis.clientId = :clientId', { clientId });
    }

    if (statut) {
      query.andWhere('devis.statut = :statut', { statut });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Devis> {
    const devis = await this.devisRepository.findOne({
      where: { id },
      relations: ['client'],
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé');
    }

    return devis;
  }

  async update(
    id: string,
    updateDevisDto: UpdateDevisDto,
    userId: string,
  ): Promise<Devis> {
    const devis = await this.findOne(id);

    // Vérifier que c'est bien le client du devis
    if (devis.clientId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres devis',
      );
    }

    Object.assign(devis, updateDevisDto);
    return this.devisRepository.save(devis);
  }

  async updateStatut(
    id: string,
    statut: DevisStatus,
    montant?: number,
  ): Promise<Devis> {
    const devis = await this.findOne(id);

    devis.statut = statut;
    if (montant !== undefined) {
      devis.montant = montant;
    }

    return this.devisRepository.save(devis);
  }

  async remove(id: string, userId: string): Promise<void> {
    const devis = await this.findOne(id);

    if (devis.clientId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres devis',
      );
    }

    await this.devisRepository.remove(devis);
  }

  async getStatistics(clientId?: string) {
    const query = this.devisRepository.createQueryBuilder('devis');

    if (clientId) {
      query.where('devis.clientId = :clientId', { clientId });
    }

    const total = await query.getCount();
    const enAttente = await query
      .clone()
      .andWhere('devis.statut = :statut', { statut: DevisStatus.EN_ATTENTE })
      .getCount();
    const accepte = await query
      .clone()
      .andWhere('devis.statut = :statut', { statut: DevisStatus.ACCEPTE })
      .getCount();
    const refuse = await query
      .clone()
      .andWhere('devis.statut = :statut', { statut: DevisStatus.REFUSE })
      .getCount();

    return {
      total,
      enAttente,
      accepte,
      refuse,
    };
  }
}