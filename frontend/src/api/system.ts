import apiClient from './client';
import type { SystemInfo } from '../types';

export const systemApi = {
  getSystemInfo: async (): Promise<SystemInfo> => {
    return apiClient.get('/system-info');
  },
};
