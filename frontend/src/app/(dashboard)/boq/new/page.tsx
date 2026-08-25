'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DataGrid } from '@mui/x-data-grid';
import { useCreateBoqMutation, useBulkReplaceBoqItemsMutation } from '@/store/api/boqApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import BOQUploader from '@/components/molecules/BOQUploader';
import { BOQ_SPREADSHEET_COLUMNS } from '@/lib/boq/spreadsheet';
import type { BOQ, BOQItemWrite } from '@/types/boq';

const schema = z.object({
  project_id: z.string().uuid('Select a project'),
  version: z.coerce.number().int().min(1),
});

type FormValues = z.output<typeof schema>;

export default function CreateBOQPage() {
  const router = useRouter();
  const { canCreate } = useCrudPermission('/boq');
  const [createBoq, { isLoading: creating, error: createError }] = useCreateBoqMutation();
  const [bulkReplace, { isLoading: importing }] = useBulkReplaceBoqItemsMutation();
  const { data: projectsData, isLoading: loadingProjects } = useGetProjectsQuery({
    page_size: 100,
  });

  const [boq, setBoq] = useState<BOQ | null>(null);
  const [uploadedItems, setUploadedItems] = useState<BOQItemWrite[] | null>(null);
  const [uploadError, setUploadError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { project_id: '', version: 1 },
  });

  const projects = projectsData?.data ?? [];

  useEffect(() => {
    document.title = 'Create BOQ | SC-GIMS';
  }, []);

  if (!canCreate) {
    return (
      <Alert severity="warning">
        You do not have permission to create BOQs.
      </Alert>
    );
  }

  // Step 1: create the draft BOQ (project + version only)
  const onCreate = async (values: FormValues) => {
    const created = await createBoq({
      project_id: values.project_id,
      version: values.version,
    }).unwrap();
    setBoq(created);
  };

  // Step 2: parse + upload the spreadsheet onto the newly created BOQ
  const handleImport = async (parsed: BOQItemWrite[]) => {
    if (!boq) return;
    setUploadError('');
    try {
      const result = await bulkReplace({ boqId: boq.id, items: parsed }).unwrap();
      setUploadedItems(parsed);
      setBoq((prev) => (prev ? { ...prev, items_count: result.data.length } : prev));
    } catch (e) {
      setUploadError(
        (e as { data?: { detail?: string } })?.data?.detail || 'Failed to upload BOQ.'
      );
    }
  };

  const apiError = (createError as { data?: { detail?: string } })?.data?.detail;

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/boq')} sx={{ mb: 2 }}>
        Back to BOQ
      </Button>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Create BOQ
      </Typography>

      {!boq && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a project and version. You&apos;ll upload the BOQ spreadsheet on the next step.
          </Typography>

          <Paper sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit(onCreate)}>
              <Stack spacing={2.5}>
                {apiError && <Alert severity="error">{String(apiError)}</Alert>}

                <Controller
                  name="project_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Project"
                      disabled={loadingProjects}
                      error={!!errors.project_id}
                      helperText={errors.project_id?.message}
                    >
                      {projects.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="version"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      label="Version"
                      error={!!errors.version}
                      helperText={errors.version?.message}
                    />
                  )}
                />

                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                  <Button onClick={() => router.push('/boq')}>Cancel</Button>
                  <Button type="submit" variant="contained" disabled={creating}>
                    {creating ? 'Creating…' : 'Continue'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Paper>
        </>
      )}

      {boq && !uploadedItems && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Upload BOQ spreadsheet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {boq.project_name} · Version {boq.version}
          </Typography>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          <BOQUploader disabled={importing} onParsed={handleImport} />
        </Paper>
      )}

      {boq && uploadedItems && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            BOQ uploaded successfully — {uploadedItems.length} line item
            {uploadedItems.length === 1 ? '' : 's'} imported.
          </Alert>
          <Paper sx={{ p: 3, mb: 3 }}>
            <DataGrid
              rows={uploadedItems.map((item, i) => ({ id: i, ...item }))}
              columns={BOQ_SPREADSHEET_COLUMNS}
              autoHeight
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              disableRowSelectionOnClick
            />
          </Paper>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => router.push('/boq')}>
              Back to BOQ list
            </Button>
            <Button variant="contained" onClick={() => router.push(`/boq/${boq.id}`)}>
              Open BOQ
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}