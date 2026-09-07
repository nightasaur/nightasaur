import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { MediaStream } from "worker_threads";

interface VoiceSession {
  id: string;
  participants: Set<string>;
  connections: Map<string, WebSocket>;
  mediaStream?: MediaStream;
}

export class VoiceService {
  private sessions: Map<string, VoiceSession> = new Map();

  async createSession(userId: string): Promise<string> {
    const sessionId = uuidv4();
    
    const session: VoiceSession = {
      id: sessionId,
      participants: new Set([userId]),
      connections: new Map()
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  async joinSession(sessionId: string, userId: string, ws: WebSocket) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");
    
    session.participants.add(userId);
    session.connections.set(userId, ws);
    
    // ?šçŸ¥?€?‰å??‡è€…æ–°?å“¡? å…¥
    this.broadcast(sessionId, {
      type: "user_joined",
      userId
    });
    
    // ?¼é€ç¾?‰æ??¡çµ¦?°ç”¨??
    ws.send(JSON.stringify({
      type: "current_users",
      users: Array.from(session.participants)
    }));
  }

  async leaveSession(sessionId: string, userId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    session.participants.delete(userId);
    session.connections.delete(userId);
    
    // ?šçŸ¥?€?‰å??‡è€…æ??¡é›¢??
    this.broadcast(sessionId, {
      type: "user_left",
      userId
    });
    
    // å¦‚æ?æ²’æ??å“¡ï¼Œé??‰æ?è©?
    if (session.participants.size === 0) {
      this.sessions.delete(sessionId);
    }
  }

  broadcast(sessionId: string, message: any) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const jsonMsg = JSON.stringify(message);
    for (const [userId, ws] of session.connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(jsonMsg);
      }
    }
  }

  routeAudio(sessionId: string, senderId: string, audioData: ArrayBuffer) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    for (const [userId, ws] of session.connections) {
      if (userId !== senderId && ws.readyState === WebSocket.OPEN) {
        ws.send(audioData, { binary: true });
      }
    }
  }
}

export const voiceService = new VoiceService();
