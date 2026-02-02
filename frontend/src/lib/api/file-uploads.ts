/**
 * File Uploads API
 * 文件上傳相關 API (GCS Backend)
 */
import { apiClient, handleApiError } from './client';

export interface FileUploaderInfo {
  userId: string;
  userName: string;
  role: string;
}

export interface FileUploadResponse {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: number;
  uploadedBy: FileUploaderInfo;
}

class FileUploadsAPI {
  /**
   * Upload file to GCS via backend
   * @param roomId Room ID
   * @param file File to upload
   * @returns File metadata with GCS public URL
   */
  async uploadFile(roomId: string, file: File): Promise<FileUploadResponse> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // POST to backend endpoint
      const response = await apiClient.post<FileUploadResponse>(
        `/api/rooms/${roomId}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // Increase timeout for large files
          timeout: 60000, // 60 seconds
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
export const fileUploadsAPI = new FileUploadsAPI();
export default fileUploadsAPI;
