import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private chatGateway: ChatGateway,
  ) {}

  async create(
    userId: string,
    titre: string,
    message: string,
    type: NotificationType,
    link?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      titre,
      message,
      type,
      link,
    });

    const saved = await this.notificationRepository.save(notification);

    // Envoyer via Socket.IO en temps réel
    this.chatGateway.sendNotification(userId, saved);

    return saved;
  }

  async findByUser(userId: string, limit = 20): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification non trouvée');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  // Méthodes helpers pour différents types de notifications
  async notifyNewInscription(
    formateurId: string,
    etudiantName: string,
    formationTitle: string,
    inscriptionId: string,
  ) {
    return this.create(
      formateurId,
      'Nouvelle inscription',
      `${etudiantName} s'est inscrit à ${formationTitle}`,
      NotificationType.FORMATION,
      `/dashboard/students`,
    );
  }

  async notifyLessonCompleted(
    formateurId: string,
    etudiantName: string,
    lessonTitle: string,
    formationId: string,
  ) {
    return this.create(
      formateurId,
      'Leçon complétée',
      `${etudiantName} a terminé "${lessonTitle}"`,
      NotificationType.FORMATION,
      `/dashboard/formations/${formationId}`,
    );
  }

  async notifyFormationCompleted(
    etudiantId: string,
    formationTitle: string,
    inscriptionId: string,
  ) {
    return this.create(
      etudiantId,
      'Formation terminée ! 🎉',
      `Félicitations ! Vous avez terminé "${formationTitle}". Téléchargez votre certificat.`,
      NotificationType.FORMATION,
      `/dashboard/formations/view/${inscriptionId}`,
    );
  }

  async notifyDevisAccepted(
    clientId: string,
    devisReference: string,
    montant: number,
    devisId: string,
  ) {
    return this.create(
      clientId,
      'Devis accepté',
      `Votre devis ${devisReference} (${montant}€) a été accepté`,
      NotificationType.DEVIS,
      `/dashboard/devis/${devisId}`,
    );
  }

  async notifyChantierUpdate(
    clientId: string,
    chantierTitle: string,
    updateMessage: string,
    chantierId: string,
  ) {
    return this.create(
      clientId,
      'Mise à jour chantier',
      `${chantierTitle}: ${updateMessage}`,
      NotificationType.CHANTIER,
      `/dashboard/chantiers/${chantierId}`,
    );
  }
}