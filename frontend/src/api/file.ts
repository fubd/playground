import apiClient from './client.js';

export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: 'file' | 'folder';
  parentId: string | null;
  createdAt: string;
}

export const fileApi = {
  listFiles: (parentId: string | null = null, q: string | null = null) => 
    apiClient.get<FileInfo[]>('/files', { params: { parentId, q } }),
  fetchRoots: () => apiClient.get<FileInfo[]>('/files/roots'),
  uploadFile: (file: File, parentId: string | null = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId) formData.append('parentId', parentId);
    return apiClient.post<FileInfo>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  createFolder: (name: string, parentId: string | null = null) => 
    apiClient.post<FileInfo>('/files/folder', { name, parentId }),
  renameItem: (id: string, name: string) => 
    apiClient.put<{ success: boolean }>(`/files/${id}/rename`, { name }),
  deleteFile: (id: string) => apiClient.delete(`/files/${id}`),
  getDownloadUrl: (id: string) => apiClient.get<{ url: string }>(`/files/download/${id}`),
};
