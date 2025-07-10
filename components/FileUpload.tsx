
import React, { useState, useCallback } from 'react';
import { UploadCloudIcon, FileIcon } from './icons';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  fileName: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, fileName }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if(e.dataTransfer.files[0].type === "application/pdf") {
          onFileChange(e.dataTransfer.files[0]);
      } else {
          alert("กรุณาอัปโหลดไฟล์ PDF เท่านั้น");
      }
      e.dataTransfer.clearData();
    }
  }, [onFileChange]);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div className="mt-4">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative block w-full rounded-lg border-2 border-dashed ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'} p-8 text-center transition-colors duration-200`}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileSelect}
          accept=".pdf"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center justify-center">
            <UploadCloudIcon />
            <span className="mt-2 block text-sm font-semibold text-primary-800">
              คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง
            </span>
            <span className="block text-xs text-gray-500">รองรับไฟล์ PDF เท่านั้น</span>
          </div>
        </label>
      </div>

      {fileName && (
        <div className="mt-4 flex items-center justify-center rounded-md bg-gray-100 p-3 text-sm text-gray-700 border border-gray-200">
          <FileIcon />
          <span className="ml-2 font-medium truncate">{fileName}</span>
        </div>
      )}
    </div>
  );
};
