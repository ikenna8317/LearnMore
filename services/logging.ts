import { ActivityLog } from '../types';

const LOGS_STORAGE_KEY = 'learn_more_activity_logs_db';

export const loggingService = {
  log(eventType: string, userId?: string, metadata?: any): void {
    try {
      // Fire and forget - using setTimeout to ensure it doesn't block main thread execution
      setTimeout(() => {
        const logs: ActivityLog[] = JSON.parse(localStorage.getItem(LOGS_STORAGE_KEY) || '[]');
        
        const newLog: ActivityLog = {
          id: crypto.randomUUID(),
          userId,
          eventType,
          metadata,
          createdAt: Date.now()
        };
        
        logs.push(newLog);
        
        // Safety cap: keep only the last 1000 logs to prevent storage bloat
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
        
        // Optional: In development, mirror to console
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[Activity] ${eventType}`, metadata || '');
        }
      }, 0);
    } catch (e) {
      // Silently fail to avoid disrupting the user experience
      console.warn("Logging failed silently", e);
    }
  }
};
