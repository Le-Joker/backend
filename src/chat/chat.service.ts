import { Injectable } from '@nestjs/common';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  recipientId?: string;
  roomId?: string;
}

@Injectable()
export class ChatService {
  // En mémoire pour l'instant (à remplacer par une base de données)
  private messages: Message[] = [];

  async saveMessage(message: Message): Promise<Message> {
    this.messages.push(message);
    
    // Garder seulement les 1000 derniers messages en mémoire
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }

    return message;
  }

  async getMessages(userId?: string, roomId?: string): Promise<Message[]> {
    if (userId) {
      // Messages entre deux utilisateurs
      return this.messages.filter(
        (msg) =>
          (msg.senderId === userId || msg.recipientId === userId),
      );
    }

    if (roomId) {
      // Messages d'une room
      return this.messages.filter((msg) => msg.roomId === roomId);
    }

    // Tous les messages publics
    return this.messages.filter((msg) => !msg.recipientId && !msg.roomId);
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const index = this.messages.findIndex((msg) => msg.id === messageId);
    if (index !== -1) {
      this.messages.splice(index, 1);
      return true;
    }
    return false;
  }
}