import { supabase } from '../lib/supabase';

type LogLevel = 'info' | 'warn' | 'error';
type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  userId?: string;
  sessionId?: string;
};

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Limitar el número de logs en memoria

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async getCurrentUser() {
    const session = await supabase.auth.getSession();
    return session.data.session?.user;
  }

  private trimLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  async log(level: LogLevel, message: string, data?: any) {
    const user = await this.getCurrentUser();
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data: data ? JSON.stringify(data) : undefined,
      userId: user?.id,
      sessionId: user?.id ? `session_${user.id}_${Date.now()}` : undefined
    };
    
    this.logs.push(logEntry);
    this.trimLogs();
    
    // Logs en desarrollo
    if (import.meta.env.DEV) {
      const style = this.getLogStyle(level);
      console.log(
        `%c${logEntry.timestamp.toISOString()} [${level.toUpperCase()}]%c ${message}`,
        style,
        'color: inherit',
        data
      );
    }

    // Almacenar errores críticos en Supabase
    if (level === 'error') {
      await this.storeErrorLog(logEntry);
    }
  }

  private getLogStyle(level: LogLevel): string {
    switch (level) {
      case 'error':
        return 'color: #ff4444; font-weight: bold';
      case 'warn':
        return 'color: #ffbb33; font-weight: bold';
      case 'info':
        return 'color: #33b5e5; font-weight: bold';
      default:
        return 'color: inherit';
    }
  }

  private async storeErrorLog(logEntry: any) {
    try {
      // En desarrollo, solo registrar en consola
      if (import.meta.env.DEV) {
        console.debug('Development mode: Error log would be stored in production', logEntry);
        return;
      }

      const { error } = await supabase
        .from('error_logs')
        .insert([logEntry])
        .select();

      if (error) {
        console.error('Failed to store error log:', error);
      }
    } catch (err) {
      console.error('Failed to store error log:', err);
    }
  }

  async info(message: string, data?: any) {
    await this.log('info', message, data);
  }

  async warn(message: string, data?: any) {
    await this.log('warn', message, data);
  }

  async error(message: string, data?: any) {
    await this.log('error', message, data);
  }

  getLogs() {
    return this.logs;
  }

  getLogsByLevel(level: LogLevel) {
    return this.logs.filter(log => log.level === level);
  }

  getLogsByUser(userId: string) {
    return this.logs.filter(log => log.userId === userId);
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();