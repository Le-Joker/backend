import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);

      // Sécurise ici : si pas de sub → déconnexion
      if (!payload?.sub) {
        client.disconnect();
        return;
      }

      client.userId = payload.sub;
      client.userEmail = payload.email;
      client.userName = `${payload.prenom || ''} ${payload.nom || ''}`.trim();

      const userId = client.userId as string;
      this.connectedUsers.set(userId, client);

      client.join(`user:${client.userId}`);

      console.log(`✅ User connected: ${client.userName} (${client.userId})`);

      this.server.emit('user:online', {
        userId: client.userId,
        userName: client.userName,
        timestamp: new Date(),
      });

      this.broadcastOnlineUsers();
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (!client.userId) return;

    this.connectedUsers.delete(client.userId);

    console.log(`❌ User disconnected: ${client.userName} (${client.userId})`);

    this.server.emit('user:offline', {
      userId: client.userId,
      userName: client.userName,
      timestamp: new Date(),
    });

    this.broadcastOnlineUsers();
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody()
    data: { recipientId?: string; content: string; roomId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Bouclier anti undefined
    if (!client.userId || !client.userName) return;

    const message = {
      id: Date.now().toString(),
      senderId: client.userId,
      senderName: client.userName,
      content: data.content,
      timestamp: new Date(),
      recipientId: data.recipientId,
      roomId: data.roomId,
    };

    await this.chatService.saveMessage(message);

    if (data.recipientId) {
      this.server
        .to(`user:${data.recipientId}`)
        .emit('message:receive', message);
      client.emit('message:sent', message);
    } else if (data.roomId) {
      this.server.to(data.roomId).emit('message:receive', message);
    } else {
      this.server.emit('message:receive', message);
    }

    return { success: true, message };
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    client.join(data.roomId);

    this.server.to(data.roomId).emit('room:user-joined', {
      userId: client.userId,
      userName: client.userName,
      roomId: data.roomId,
      timestamp: new Date(),
    });

    return { success: true, roomId: data.roomId };
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    client.leave(data.roomId);

    this.server.to(data.roomId).emit('room:user-left', {
      userId: client.userId,
      userName: client.userName,
      roomId: data.roomId,
      timestamp: new Date(),
    });

    return { success: true, roomId: data.roomId };
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @MessageBody() data: { recipientId?: string; roomId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const typingData = {
      userId: client.userId,
      userName: client.userName,
    };

    if (data.recipientId) {
      this.server
        .to(`user:${data.recipientId}`)
        .emit('typing:user-started', typingData);
    } else if (data.roomId) {
      client.to(data.roomId).emit('typing:user-started', typingData);
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: { recipientId?: string; roomId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const typingData = {
      userId: client.userId,
      userName: client.userName,
    };

    if (data.recipientId) {
      this.server
        .to(`user:${data.recipientId}`)
        .emit('typing:user-stopped', typingData);
    } else if (data.roomId) {
      client.to(data.roomId).emit('typing:user-stopped', typingData);
    }
  }

  private broadcastOnlineUsers() {
    const onlineUsers = Array.from(this.connectedUsers.values()).map(
      (socket) => ({
        userId: socket.userId,
        userName: socket.userName,
      }),
    );

    this.server.emit('users:online-list', onlineUsers);
  }

  sendNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:receive', notification);
  }
}
