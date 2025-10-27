import { FastifyReply } from 'fastify';

type Subscriber = FastifyReply;

class TaskStreamBroadcaster {
  private subscribers: Map<string, Set<Subscriber>> = new Map();

  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start heartbeat interval
    this.startHeartbeat();
  }

  subscribe(taskId: string, response: Subscriber): void {
    if (!this.subscribers.has(taskId)) {
      this.subscribers.set(taskId, new Set());
    }
    const subscribers = this.subscribers.get(taskId);
    if (subscribers) {
      subscribers.add(response);
    }

    // Clean up on client disconnect
    response.raw.on('close', () => {
      this.unsubscribe(taskId, response);
    });
  }

  unsubscribe(taskId: string, response: Subscriber): void {
    const subscribers = this.subscribers.get(taskId);
    if (subscribers) {
      subscribers.delete(response);
      if (subscribers.size === 0) {
        this.subscribers.delete(taskId);
      }
    }
  }

  broadcast(taskId: string, payload: unknown): void {
    const subscribers = this.subscribers.get(taskId);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const data = JSON.stringify({
      type: 'task.updated',
      taskId,
      payload,
    });

    subscribers.forEach((response) => {
      try {
        response.raw.write(`data: ${data}\n\n`);
      } catch (error) {
        // Client disconnected, clean up
        this.unsubscribe(taskId, response);
      }
    });
  }

  private startHeartbeat(): void {
    if (this.pingInterval) {
      return;
    }

    this.pingInterval = setInterval(() => {
      // Send ping to all active connections to keep them alive
      this.subscribers.forEach((subscribers) => {
        subscribers.forEach((response) => {
          try {
            response.raw.write(':ping\n\n');
          } catch (error) {
            // Silently ignore - connection already closed
          }
        });
      });
    }, 25000); // 25 seconds
  }

  public destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.subscribers.clear();
  }
}

// Singleton instance
export const taskStreamBroadcaster = new TaskStreamBroadcaster();

