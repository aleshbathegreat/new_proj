'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import StatusChip from '@/components/molecules/StatusChip';
import SurveyUploader from '@/components/molecules/SurveyUploader';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import {
  useGetSurveyQuery,
  useGetSurveyItemsQuery,
  useBulkReplaceSurveyItemsMutation,
  useCreateSurveyItemMutation,
  useUpdateSurveyItemMutation,
  useDeleteSurveyItemMutation,
} from '@/store/api/surveyApi';
import type { SurveyItem, SurveyRowData } from '@/types/survey';

export default function SurveyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = String(params.id);
  const { canCreate, canUpdate, canDelete } = useCrudPermission('/survey');

  const { data: survey, isLoading, isError } = useGetSurveyQuery(surveyId);
  const { data: itemsData, isLoading: loadingItems, refetch } = useGetSurveyItemsQuery(surveyId);
  const [bulkReplace, { isLoading: importing }] = useBulkReplaceSurveyItemsMutation();
  const [createItem] = useCreateSurveyItemMutation();
  const [updateItem] = useUpdateSurveyItemMutation();
  const [deleteItem] = useDeleteSurveyItemMutation();

  const [deleteTarget, setDeleteTarget] = useState<SurveyItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newRow, setNewRow] = useState<SurveyRowData>({});

  useEffect(() => {
    document.title = survey ? `Survey — ${survey.project_name} | SC-GIMS` : 'Survey | SC-GIMS';
  }, [survey]);

  if (isLoading) return <PageSkeleton />;
  if (isError || !survey) {
    return (
      <Box>
        <Alert severity="error">Survey not found.</Alert>
        <Button onClick={() => router.push('/survey')} sx={{ mt: 2 }}>Back to Survey</Button>
      </Box>
    );
  }

  const items = itemsData?.data ?? [];
  // Dynamic columns: union of every key across all rows, so a row missing
  // a column doesn't hide that column for rows that do have it.
  const allKeys = Array.from(new Set(items.flatMap((it) => Object.keys(it.data))));

  const columns: GridColDef[] = [
    ...allKeys.map((key) => ({ field: key, headerName: key, flex: 1, minWidth: 130, editable: canUpdate })),
    ...(canDelete
      ? [{
          field: 'actions',
          headerName: '',
          width: 60,
          sortable: false,
          filterable: false,
          renderCell: ({ row }: { row: SurveyItem & { id: string } }) => (
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteTarget(items.find((it) => it.id === row.id) ?? null)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          ),
        }]
      : []),
  ];

  const rows = items.map((it) => ({ id: it.id, ...it.data }));

  const handleCellEdit = async (newRowData: Record<string, unknown>, oldRowData: Record<string, unknown>) => {
    const item = items.find((it) => it.id === oldRowData.id);
    if (!item) return oldRowData;
    const { id: _id, ...data } = newRowData;
    await updateItem({ id: item.id, surveyId, data: data as SurveyRowData }).unwrap();
    return newRowData;
  };

  const handleImport = async (parsedRows: SurveyRowData[]) => {
    await bulkReplace({ surveyId, rows: parsedRows }).unwrap();
    refetch();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteItem({ id: deleteTarget.id, surveyId }).unwrap();
    setDeleteTarget(null);
    refetch();
  };

  const handleAddRow = async () => {
    await createItem({ surveyId, data: newRow }).unwrap();
    setAddOpen(false);
    setNewRow({});
    refetch();
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/survey')}>
          Back to Survey
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5">{survey.project_name} — Survey</Typography>
          <Typography variant="body2" color="text.secondary">
            Version {survey.version} · {survey.items_count} rows
          </Typography>
        </Box>
        <StatusChip status={survey.status} />
      </Stack>

      {canCreate && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Re-upload spreadsheet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Uploading a new file replaces all existing rows on this survey.
          </Typography>
          <SurveyUploader disabled={importing} onParsed={handleImport} />
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Rows</Typography>
          {canCreate && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => { setNewRow(Object.fromEntries(allKeys.map((k) => [k, '']))); setAddOpen(true); }}
            >
              Add Row
            </Button>
          )}
        </Stack>
        {loadingItems ? (
          <PageSkeleton />
        ) : items.length === 0 ? (
          <Alert severity="info">No rows yet. Upload a spreadsheet above.</Alert>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            disableRowSelectionOnClick
            processRowUpdate={handleCellEdit}
          />
        )}
      </Paper>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Row</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {allKeys.length === 0 && (
              <Alert severity="info">No columns yet — upload a spreadsheet first to establish columns.</Alert>
            )}
            {allKeys.map((key) => (
              <TextField
                key={key}
                label={key}
                value={newRow[key] ?? ''}
                onChange={(e) => setNewRow((r) => ({ ...r, [key]: e.target.value }))}
                fullWidth
                size="small"
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={allKeys.length === 0} onClick={handleAddRow}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Row</DialogTitle>
        <DialogContent>
          <Typography>Delete this row permanently?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}