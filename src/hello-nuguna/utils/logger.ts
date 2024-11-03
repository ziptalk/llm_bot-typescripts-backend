// src/hello-nuguna/utils/logger.ts
export const logger = {
  info: (message: string) => console.log(`[INFO]: ${message}`),
  warn: (message: string) => console.warn(`[WARN]: ${message}`),
  error: (message: string, error?: any) => console.error(`[ERROR]: ${message}`, error),
};