import { useEffect, useRef, useState } from 'react';
import { useTaskTimer } from '@/stores/useTaskTimer';
import type { TaskUpdatedEvent } from '@/types/taskTimer.types';
import { api } from '@/lib/api';

const API_URL = api.defaults.baseURL ?? 'http://localhost:3001/api';

interface UseTaskStreamResult {
  isConnected: boolean;
  error: Error | null;
}

export function useTaskStream(taskId: string | undefined): UseTaskStreamResult {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const setFromView = useTaskTimer((state) => state.setFromView);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    const token = localStorage.getItem('token');
    const url = `${API_URL}/tasks/stream?taskId=${taskId}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

    const connect = () => {
      // Clean up any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TaskUpdatedEvent;
          
          if (data.type === 'task.updated' && data.payload) {
            setFromView(data.payload);
          }
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        setIsConnected(false);
        eventSource.close();

        // Exponential backoff reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current += 1;

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Reconnecting SSE (attempt ${reconnectAttemptsRef.current})...`);
          connect();
        }, delay);
      };

      eventSourceRef.current = eventSource;
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setIsConnected(false);
    };
  }, [taskId, setFromView]);

  return { isConnected, error };
}

