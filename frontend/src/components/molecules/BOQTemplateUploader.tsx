'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { parseTemplateHeaders } from '@/lib/boq/templateImport';
import type { BOQTemplateField } from '@/types/boqTemplate';

interface BOQTemplateUploaderProps {
  onFieldsParsed: (fields: BOQTemplateField[]) => void;
  isLoading?: boolean;
}

export default function BOQTemplateUploader({
  onFieldsParsed,
  isLoading = false,
}: BOQTemplateUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleParse = async (file: File) => {
    if (!file.name.match(/\.(xlsx?|csv)$/i)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    try {
      setError(null);
      const buffer = await file.arrayBuffer();
      const fields = parseTemplateHeaders(buffer);

      if (fields.length === 0) {
        setError('No columns found in the first row');
        return;
      }

      onFieldsParsed(fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
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
    if (files[0]) handleParse(files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files?.[0]) handleParse(files[0]);
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
          backgroundColor: isDragActive ? 'action.hover' : 'action.hover',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="template-file-input"
          disabled={isLoading}
        />
        <label
          htmlFor="template-file-input"
          style={{ cursor: isLoading ? 'not-allowed' : 'pointer', display: 'block' }}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ mb: 1 }} />
          ) : (
            <CloudUploadIcon sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
          )}
          <div>
            <strong>Drag and drop an Excel file here, or click to browse</strong>
          </div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#666' }}>
            The first row should contain column headers. We'll guess the data type from the rows below.
          </div>
        </label>
      </Box>
    </Box>
  );
}