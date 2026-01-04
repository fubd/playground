import apiClient from './client.js';

export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export const fileApi = {
  listFiles: () => apiClient.get<FileInfo[]>('/files'),
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<FileInfo>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteFile: (id: string) => apiClient.delete(`/files/${id}`),
  getDownloadUrl: (id: string) => apiClient.get<{ url: string }>(`/files/download/${id}`),
};
