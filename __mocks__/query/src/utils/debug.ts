import type { DebugLevel, DebugOptions } from '../types/query';

export class QueryDebugger {
  private static instance: QueryDebugger;
  private options: DebugOptions = {
    level: 'none',
  };

  private constructor() {}

  static getInstance(): QueryDebugger {
    if (!QueryDebugger.instance) {
      QueryDebugger.instance = new QueryDebugger();
    }
    return QueryDebugger.instance;
  }

  configure(options: DebugOptions): void {
    this.options = options;
  }

  private shouldLog(level: DebugLevel): boolean {
    const levels: DebugLevel[] = ['none', 'error', 'warn', 'info', 'debug'];
    const currentLevel = levels.indexOf(this.options.level);
    const messageLevel = levels.indexOf(level);
    return messageLevel <= currentLevel && currentLevel > 0;
  }

  private formatMessage(level: DebugLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[Contentrain Query ${level.toUpperCase()}] ${timestamp}:`;
    const formattedMessage = `${prefix} ${message}`;
    if (data) {
      return `${formattedMessage}\n${JSON.stringify(data, null, 2)}`;
    }
    return formattedMessage;
  }

  log(level: DebugLevel, message: string, data?: any): void {
    if (!this.shouldLog(level))
      return;

    const formattedMessage = this.formatMessage(level, message, data);

    if (this.options.logger) {
      this.options.logger(level, message, data);
      return;
    }

    switch (level) {
      case 'none':
        return;
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
    }
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }
}
