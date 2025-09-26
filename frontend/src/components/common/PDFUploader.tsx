/**
 * PDFUploader - PDF/圖片上傳組件
 *
 * 支援上傳和預覽 PDF 或圖片文件
 */

'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';

interface UploadedFile {
  type: 'pdf' | 'image';
  url: string;
  name: string;
}

interface PDFUploaderProps {
  title?: string;
  subtitle?: string;
  onFileUpload?: (file: File) => void;
  acceptedFormats?: string;
  className?: string;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  title = '上傳文件',
  subtitle = '支援 PDF 或圖片格式 (JPG, PNG)',
  onFileUpload,
  acceptedFormats = '.pdf,image/*',
  className = '',
}) => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
    const url = URL.createObjectURL(file);

    setUploadedFile({
      type: fileType,
      url,
      name: file.name,
    });

    if (onFileUpload) {
      onFileUpload(file);
    }
  };

  const removeUploadedFile = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.url);
      setUploadedFile(null);
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
      </div>

      {!uploadedFile ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <Upload className="w-16 h-16 text-gray-400 mx-auto" />
            </div>
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              拖曳或選擇文件
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{subtitle}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              選擇文件
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {uploadedFile.type === 'pdf' ? (
                <FileText className="w-5 h-5 text-red-600" />
              ) : (
                <ImageIcon className="w-5 h-5 text-blue-600" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                {uploadedFile.name}
              </span>
            </div>
            <button
              onClick={removeUploadedFile}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="移除文件"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* File Display Area */}
          <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            {uploadedFile.type === 'pdf' ? (
              <iframe src={uploadedFile.url} className="w-full h-full rounded" title="PDF Viewer" />
            ) : (
              <img
                src={uploadedFile.url}
                alt="Uploaded Document"
                className="w-full h-auto rounded"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
