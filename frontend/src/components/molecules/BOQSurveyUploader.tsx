'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useUploadBOQSurveyDataMutation } from '@/store/api/boqSurveyApi';

interface BOQSurveyUploaderProps {
  boqId: string;
  onUploadSuccess?: () => void;
  isLoading?: boolean;
}

export default function BOQSurveyUploader({
  boqId,
  onUploadSuccess,
  isLoading = false,
}: BOQSurveyUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadSurvey, { isLoading: isUploading }] = useUploadBOQSurveyDataMutation();

  const handleUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx?|csv)$/i)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    try {
      setError(null);
      await uploadSurvey({ boqId, file }).unwrap();
      console.log('Survey data uploaded successfully');
      onUploadSuccess?.();
    } catch (err: any) {
      const errorMsg = err?.data?.file?.[0] || err?.data?.detail || 'Failed to upload survey';
      setError(errorMsg);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files[0]) handleUpload(files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files?.[0]) handleUpload(files[0]);
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 1,
          textAlign: 'center',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="survey-file-input"
          disabled={isUploading || isLoading}
        />
        <label
          htmlFor="survey-file-input"
          style={{ cursor: isUploading || isLoading ? 'not-allowed' : 'pointer', display: 'block' }}
        >
          {isUploading ? (
            <CircularProgress size={24} sx={{ mb: 1 }} />
          ) : (
            <CloudUploadIcon sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
          )}
          <div>
            <strong>Drag survey sheet here, or click to browse</strong>
          </div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#666' }}>
            Excel file with district/site-wise quantities. Must match BOQ item names.
          </div>
        </label>
      </Box>
    </Box>
  );
}