"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// src/hello-nuguna/utils/logger.ts
exports.logger = {
    info: (message) => console.log(`[INFO]: ${message}`),
    warn: (message) => console.warn(`[WARN]: ${message}`),
    error: (message, error) => console.error(`[ERROR]: ${message}`, error),
};
