'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { parseSurveySpreadsheet } from '@/lib/survey/spreadsheet';
import type { SurveyRowData } from '@/types/survey';

type UploadStatus = 'idle' | 'parsing' | 'done' | 'error';

interface SurveyUploaderProps {
  disabled?: boolean;
  onParsed: (rows: SurveyRowData[]) => Promise<void> | void;
}

export default function SurveyUploader({ disabled, onParsed }: SurveyUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFileName(file.name);
    setStatus('parsing');
    setMessage('');

    try {
      const buffer = await file.arrayBuffer();
      const rows = parseSurveySpreadsheet(buffer);
      if (rows.length === 0) {
        setStatus('error');
        setMessage('No survey rows found. Check that the sheet has a header row and data below it.');
        return;
      }
      await onParsed(rows);
      setStatus('done');
      setMessage(`Imported ${rows.length} survey row${rows.length === 1 ? '' : 's'} from ${file.name}.`);
    } catch (err) {
      setStatus('error');
      setMessage(
        (err as { data?: { detail?: string } })?.data?.detail ||
          (err as Error)?.message ||
          'Failed to parse or upload survey spreadsheet.'
      );
    }
  };

  return (
    <Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center' }}>
      {status === 'idle' && (
        <>
          <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" sx={{ mb: 1 }}>
            Import survey spreadsheet (.xlsx)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Every column in the sheet is imported as-is — no fixed template required.
          </Typography>
          <Button variant="outlined" component="label" disabled={disabled}>
            Choose Excel file
            <input type="file" hidden accept=".xlsx,.xls" disabled={disabled} onChange={handleFileChange} />
          </Button>
        </>
      )}
      {status === 'parsing' && (
        <Box>
          <Typography sx={{ mb: 1 }}>Parsing {fileName}…</Typography>
          <LinearProgress />
        </Box>
      )}
      {status === 'done' && (
        <Box>
          <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>{message}</Alert>
          <Button variant="outlined" component="label" disabled={disabled}>
            Replace with another file
            <input type="file" hidden accept=".xlsx,.xls" disabled={disabled} onChange={handleFileChange} />
          </Button>
        </Box>
      )}
      {status === 'error' && (
        <Box>
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{message}</Alert>
          <Button variant="outlined" component="label" disabled={disabled}>
            Try again
            <input type="file" hidden accept=".xlsx,.xls" disabled={disabled} onChange={handleFileChange} />
          </Button>
        </Box>
      )}
    </Box>
  );
}