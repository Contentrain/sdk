import process from 'node:process';
import debug from 'debug';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Önceden tanımlanmış namespace'ler
export const LOGGER_NAMESPACES = {
  CACHE: 'cache',
  QUERY: 'query',
  LOADER: 'loader',
  SQLITE: 'sqlite',
  RELATION: 'relation',
  TRANSLATION: 'translation',
  EXECUTOR: 'executor',
  DEFAULT: 'default',
} as const;

function createLogger(namespace: string) {
  const debugLogger = debug(`contentrain:query:${namespace}`);

  return {
    debug: (message: string, data?: Record<string, unknown>) => {
      if (isDevelopment) {
        debugLogger({ message, ...data });
      }
    },
    info: (message: string, data?: Record<string, unknown>) => {
      debugLogger({ message, ...data });
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      debugLogger({ message, ...data });
    },
    error: (message: string, data?: Record<string, unknown>) => {
      debugLogger({ message, ...data });
    },
  };
}

// Her modül için önceden oluşturulmuş logger'lar
export const loggers = {
  cache: createLogger(LOGGER_NAMESPACES.CACHE),
  query: createLogger(LOGGER_NAMESPACES.QUERY),
  loader: createLogger(LOGGER_NAMESPACES.LOADER),
  sqlite: createLogger(LOGGER_NAMESPACES.SQLITE),
  relation: createLogger(LOGGER_NAMESPACES.RELATION),
  translation: createLogger(LOGGER_NAMESPACES.TRANSLATION),
  executor: createLogger(LOGGER_NAMESPACES.EXECUTOR),
  default: createLogger(LOGGER_NAMESPACES.DEFAULT),
};

// Debug modunu sadece development ortamında aktif et
if (isDevelopment) {
  debug.enable('contentrain:query:*');
}

export { createLogger };
