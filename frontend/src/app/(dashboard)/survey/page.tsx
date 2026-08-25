'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import DataTable from '@/components/organisms/DataTable';
import StatusChip from '@/components/molecules/StatusChip';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import SurveyUploader from '@/components/molecules/SurveyUploader';
import { formatDate } from '@/utils/formatDate';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import {
  useGetSurveysQuery,
  useCreateSurveyMutation,
  useBulkReplaceSurveyItemsMutation,
} from '@/store/api/surveyApi';
import type { Survey, SurveyRowData } from '@/types/survey';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import { useRouter } from 'next/navigation';
import { useDeleteSurveyMutation, useUpdateSurveyMutation } from '@/store/api/surveyApi';

export default function SurveyListPage() {
  const { canCreate } = useCrudPermission('/survey');
  const { data, isLoading, isError, error, refetch, isFetching } = useGetSurveysQuery();
  const { data: projectsData, isLoading: loadingProjects } = useGetProjectsQuery({ page_size: 100 });
  const [createSurvey, { isLoading: creating, error: createError }] = useCreateSurveyMutation();
  const [bulkReplace, { isLoading: importing }] = useBulkReplaceSurveyItemsMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [version, setVersion] = useState(1);
  const [createdSurvey, setCreatedSurvey] = useState<Survey | null>(null);
  const [uploadedRows, setUploadedRows] = useState<SurveyRowData[] | null>(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    document.title = 'Survey | SC-GIMS';
  }, []);

  const surveys = data?.data ?? [];
  const projects = projectsData?.data ?? [];


  const resetDialog = () => {
    setProjectId('');
    setVersion(1);
    setCreatedSurvey(null);
    setUploadedRows(null);
    setUploadError('');
  };

  const handleOpen = () => {
    resetDialog();
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    resetDialog();
    refetch();
  };

  const handleCreate = async () => {
    if (!projectId) return;
    const survey = await createSurvey({ project_id: projectId, version }).unwrap();
    setCreatedSurvey(survey);
  };

  const handleImport = async (rows: SurveyRowData[]) => {
    if (!createdSurvey) return;
    setUploadError('');
    try {
      await bulkReplace({ surveyId: createdSurvey.id, rows }).unwrap();
      setUploadedRows(rows);
    } catch (e) {
      setUploadError(
        (e as { data?: { detail?: string } })?.data?.detail || 'Failed to upload survey.'
      );
    }
  };

  // Dynamic columns derived from whatever headers were actually in the sheet
  const uploadedColumns: GridColDef[] = uploadedRows?.length
    ? Object.keys(uploadedRows[0]).map((key) => ({ field: key, headerName: key, flex: 1, minWidth: 120 }))
    : [];

  const apiError = (createError as { data?: { detail?: string } })?.data?.detail;
  const router = useRouter();
  const { canUpdate, canDelete } = useCrudPermission('/survey');
  const [deleteSurvey] = useDeleteSurveyMutation();
  const [updateSurvey] = useUpdateSurveyMutation();
  const [editSurvey, setEditSurvey] = useState<Survey | null>(null);
  const [editVersion, setEditVersion] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Survey | null>(null);

  const handleSaveEdit = async () => {
    if (!editSurvey) return;
    await updateSurvey({ id: editSurvey.id, data: { version: editVersion } }).unwrap();
    setEditSurvey(null);
    refetch();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteSurvey(deleteTarget.id).unwrap();
    setDeleteTarget(null);
    refetch();
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Box>
          <Typography variant="h5" component="h1">
            Survey
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Project-wide survey data — upload any survey sheet, every column is captured as-is.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isFetching}>
            Refresh
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
              Create Survey
            </Button>
          )}
        </Stack>
      </Stack>

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <Alert severity="error">
          {(error as { data?: { detail?: string } })?.data?.detail || 'Failed to load surveys.'}
        </Alert>
      ) : surveys.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No surveys yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a survey for a project to start tracking whatever data your survey sheet contains.
          </Typography>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
              Create first survey
            </Button>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <DataTable
            rows={surveys}
            columns={[
              { field: 'project_name', headerName: 'Project', flex: 1.5 },
              {
                field: 'version',
                headerName: 'Version',
                flex: 0.5,
                renderCell: ({ row }: { row: Survey }) => `v${row.version}`,
              },
              { field: 'items_count', headerName: 'Rows', flex: 0.5 },
              {
                field: 'status',
                headerName: 'Status',
                flex: 0.8,
                renderCell: ({ row }: { row: Survey }) => <StatusChip status={row.status} />,
              },
              {
                field: 'uploaded_by_name',
                headerName: 'Uploaded By',
                flex: 1,
                renderCell: ({ row }: { row: Survey }) => row.uploaded_by_name || '—',
              },
              {
                field: 'updated_at',
                headerName: 'Last Updated',
                flex: 1,
                renderCell: ({ row }: { row: Survey }) => formatDate(row.updated_at),
              },
              {
                field: 'actions',
                headerName: 'Actions',
                width: 72,
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                align: 'center',
                headerAlign: 'center',
                renderCell: ({ row }: { row: Survey }) => (
                    <RowActionsMenu
                    actions={[
                        {
                        key: 'view',
                        label: 'View',
                        icon: <VisibilityIcon fontSize="small" />,
                        onClick: () => router.push(`/survey/${row.id}`),
                        },
                        ...(canUpdate ? [{
                        key: 'edit',
                        label: 'Edit version',
                        icon: <EditIcon fontSize="small" />,
                        onClick: () => { setEditSurvey(row); setEditVersion(row.version); },
                        }] : []),
                        ...(canDelete ? [{
                        key: 'delete',
                        label: 'Delete',
                        icon: <DeleteIcon fontSize="small" />,
                        onClick: () => setDeleteTarget(row),
                        }] : []),
                    ]}
                    />
                ),
                },
            ]}
            rowCount={surveys.length}
            paginationModel={{ page: 0, pageSize: 10 }}
            onPaginationModelChange={() => {}}
          />
        </Paper>
      )}

      {/* Create + upload, all in one dialog — no separate page */}
      <Dialog open={dialogOpen} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>Create Survey</DialogTitle>
        <DialogContent>
          {!createdSurvey && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {apiError && <Alert severity="error">{String(apiError)}</Alert>}
              <TextField
                select
                fullWidth
                label="Project"
                value={projectId}
                disabled={loadingProjects}
                onChange={(e) => setProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="number"
                fullWidth
                label="Version"
                value={version}
                onChange={(e) => setVersion(Math.max(1, Number(e.target.value) || 1))}
              />
            </Stack>
          )}

          {createdSurvey && !uploadedRows && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {createdSurvey.project_name} · Version {createdSurvey.version}
              </Typography>
              {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
              <SurveyUploader disabled={importing} onParsed={handleImport} />
            </Box>
          )}

          {createdSurvey && uploadedRows && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Survey uploaded successfully — {uploadedRows.length} row
                {uploadedRows.length === 1 ? '' : 's'} imported.
              </Alert>
              <DataGrid
                rows={uploadedRows.map((row, i) => ({ id: i, ...row }))}
                columns={uploadedColumns}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                disableRowSelectionOnClick
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{uploadedRows ? 'Done' : 'Cancel'}</Button>
          {!createdSurvey && (
            <Button variant="contained" disabled={!projectId || creating} onClick={handleCreate}>
              {creating ? 'Creating…' : 'Continue'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Dialog open={!!editSurvey} onClose={() => setEditSurvey(null)}>
        <DialogTitle>Edit Survey Version</DialogTitle>
        <DialogContent>
            <TextField
            type="number"
            fullWidth
            label="Version"
            value={editVersion}
            onChange={(e) => setEditVersion(Math.max(1, Number(e.target.value) || 1))}
            sx={{ mt: 1 }}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setEditSurvey(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit}>Save</Button>
        </DialogActions>
        </Dialog>

        <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Survey</DialogTitle>
        <DialogContent>
            <Typography>
            Delete survey v{deleteTarget?.version} for {deleteTarget?.project_name}?
            This removes all {deleteTarget?.items_count} rows permanently.
            </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleConfirmDelete}>Delete</Button>
        </DialogActions>
        </Dialog>    
    </Box>
  );
}