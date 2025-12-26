import { Server } from 'socket.io';
import http from 'http';
import logger from '../config/logger';

export interface UserPresence {
  userId: string;
  email: string;
  cursor?: { x: number; y: number };
  selection?: string[];
  activeProjectId?: string;
}

export class CollaborationServer {
  private io: Server;
  private userPresence = new Map<string, UserPresence>();

  constructor(server: http.Server) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on('connection', (socket: any) => {
      logger.info('User connected', { socketId: socket.id });

      // User joins a project
      socket.on('join-project', (data: { projectId: string; userId: string; email: string }) => {
        socket.join(`project:${data.projectId}`);
        this.userPresence.set(socket.id, {
          userId: data.userId,
          email: data.email,
          activeProjectId: data.projectId,
        });

        // Broadcast presence
        this.io.to(`project:${data.projectId}`).emit('user-joined', {
          users: Array.from(this.userPresence.values()).filter(
            u => u.activeProjectId === data.projectId
          ),
        });

        logger.info('User joined project', {
          socketId: socket.id,
          projectId: data.projectId,
        });
      });

      // Tree structure update
      socket.on('tree-update', (data: { projectId: string; tree: any }) => {
        socket.to(`project:${data.projectId}`).emit('tree-updated', {
          tree: data.tree,
          updatedBy: this.userPresence.get(socket.id)?.email,
        });
      });

      // Cursor movement
      socket.on('cursor-move', (data: { projectId: string; x: number; y: number }) => {
        const presence = this.userPresence.get(socket.id);
        if (presence) {
          presence.cursor = { x: data.x, y: data.y };
        }

        socket.to(`project:${data.projectId}`).emit('cursor-moved', {
          userId: presence?.userId,
          email: presence?.email,
          cursor: { x: data.x, y: data.y },
        });
      });

      // Comment/note
      socket.on('add-comment', (data: { projectId: string; comment: string; path: string }) => {
        this.io.to(`project:${data.projectId}`).emit('comment-added', {
          comment: data.comment,
          path: data.path,
          by: this.userPresence.get(socket.id)?.email,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('disconnect', () => {
        const presence = this.userPresence.get(socket.id);
        if (presence) {
          this.io.to(`project:${presence.activeProjectId}`).emit('user-left', {
            email: presence.email,
            users: Array.from(this.userPresence.values()).filter(
              u => u.activeProjectId === presence.activeProjectId
            ),
          });
        }

        this.userPresence.delete(socket.id);
        logger.info('User disconnected', { socketId: socket.id });
      });
    });
  }

  getServer(): Server {
    return this.io;
  }
}
