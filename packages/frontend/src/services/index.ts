/**
 * Serviços de API
 * Exporte todos os serviços aqui
 */

export { default as apiClient } from './api';

// Mock services para desenvolvimento
export * from './mockDatabase';
export { default as mockApi } from './mockApi';
export { getMockWebSocket, createMockWebSocket, useMockWebSocket } from './mockWebSocket';
export type { MockWebSocket } from './mockWebSocket';
