'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useGetBoqTemplatesQuery, useDeleteBoqTemplateMutation } from '@/store/api/boqTemplateApi';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import type { BOQTemplate } from '@/types/boqTemplate';

export default function BOQTemplatesPage() {
  const router = useRouter();
  const { canCreate } = useCrudPermission('/boq-templates');
  const { data, isLoading, error } = useGetBoqTemplatesQuery();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteBoqTemplateMutation();

  useEffect(() => {
    document.title = 'BOQ Templates | SC-GIMS';
  }, []);

  const templates = useMemo(() => data?.data ?? [], [data]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteTemplate(id).unwrap();
      console.log('Template deleted');
    } catch (err) {
      console.error('Failed to delete template');
    }
  };

  if (!canCreate) {
    return (
      <Alert severity="warning">
        You do not have permission to manage BOQ templates.
      </Alert>
    );
  }

  if (isLoading) return <PageSkeleton />;

  const columns: GridColDef<BOQTemplate>[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 150,
      renderCell: ({ value }) => (
        <Chip label={value} variant="outlined" size="small" />
      ),
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 120,
      renderCell: ({ value }) => (
        <Chip
          label={value === 'MANUAL' ? 'Manual' : 'Imported'}
          size="small"
          variant={value === 'MANUAL' ? 'filled' : 'outlined'}
          color={value === 'MANUAL' ? 'default' : 'primary'}
        />
      ),
    },
    {
      field: 'field_count',
      headerName: 'Fields',
      width: 80,
      align: 'center',
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 80,
      renderCell: ({ value }) => (
        <Chip
          label={value ? 'Yes' : 'No'}
          size="small"
          color={value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 140,
      renderCell: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/admin/boq-templates/${row.id}`)}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDelete(row.id)}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">BOQ Templates</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/admin/boq-templates/new')}
        >
          New Template
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load templates
        </Alert>
      )}

      <DataGrid
        rows={templates}
        columns={columns}
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        sx={{ height: 500 }}
      />
    </Box>
  );
}