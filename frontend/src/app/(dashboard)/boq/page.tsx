'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BarChartIcon from '@mui/icons-material/BarChart';
import DataTable from '@/components/organisms/DataTable';
import StatusChip from '@/components/molecules/StatusChip';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import { formatDate } from '@/utils/formatDate';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { useGetBoqsQuery } from '@/store/api/boqApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import type { BOQ } from '@/types/boq';

export default function BOQListPage() {
  const router = useRouter();
  const { canCreate } = useCrudPermission('/boq');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  const {
    data: boqData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetBoqsQuery({
    page_size: 100,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(projectFilter ? { project_id: projectFilter } : {}),
  });

  const { data: projectsData } = useGetProjectsQuery({ page_size: 100 });

  useEffect(() => {
    document.title = 'BOQ | SC-GIMS';
  }, []);

  const boqs = boqData?.data ?? [];
  const projects = projectsData?.data ?? [];

  const projectGroups = useMemo(() => {
    const byProject = new Map<
      string,
      { projectName: string; boqs: BOQ[]; totalAmount: number }
    >();
    for (const boq of boqs) {
      const key = String(boq.project_id);
      const existing = byProject.get(key) ?? {
        projectName: boq.project_name,
        boqs: [],
        totalAmount: 0,
      };
      existing.boqs.push(boq);
      existing.totalAmount += Number(boq.total_amount || 0);
      byProject.set(key, existing);
    }
    return Array.from(byProject.entries())
      .map(([projectId, group]) => ({
        projectId,
        ...group,
        boqs: [...group.boqs].sort((a, b) => a.site_name.localeCompare(b.site_name)),
      }))
      .sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [boqs]);

  if (isLoading) return <PageSkeleton />;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <Box>
          <Typography variant="h5" component="h1">
            Bill of Quantities
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Open a BOQ to view the landed-cost spreadsheet (PC1 → TotalDDP PKR), import Excel, and
            publish.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Refresh
          </Button>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/boq/new')}
            >
              Create BOQ
            </Button>
          )}
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            label="Project"
            size="small"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All projects</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {['DRAFT', 'READY', 'PUBLISHED', 'UPLOADING', 'PARSING'].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as { data?: { detail?: string } })?.data?.detail ||
            'Failed to load BOQs. Check API connection and your permissions.'}
        </Alert>
      )}

      {!isError && projectGroups.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No BOQs yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a BOQ for a project site to start tracking landed costs and DDP.
          </Typography>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/boq/new')}>
              Create first BOQ
            </Button>
          )}
        </Paper>
      ) : (
        projectGroups.map(({ projectId, projectName, boqs: groupBoqs, totalAmount }) => (
          <Paper key={projectId} sx={{ mb: 3, p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.5,
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="h6">
                {projectName}{' '}
                <Chip label={groupBoqs.length} size="small" sx={{ ml: 1 }} />
              </Typography>
              <Chip
                label={`PKR ${Number(totalAmount).toLocaleString()}`}
                color="primary"
                variant="outlined"
              />
            </Box>

            <DataTable
              rows={groupBoqs}
              columns={[
                { field: 'site_name', headerName: 'Site', flex: 1.5 },
                {
                  field: 'template',
                  headerName: 'Template',
                  flex: 1,
                  renderCell: ({ row }: { row: BOQ }) => row.template || '—',
                },
                {
                  field: 'version',
                  headerName: 'Version',
                  flex: 0.5,
                  renderCell: ({ row }: { row: BOQ }) => `v${row.version}`,
                },
                { field: 'items_count', headerName: 'Items', flex: 0.5 },
                {
                  field: 'total_amount',
                  headerName: 'TotalDDP PKR',
                  flex: 1,
                  renderCell: ({ row }: { row: BOQ }) =>
                    `PKR ${Number(row.total_amount || 0).toLocaleString()}`,
                },
                {
                  field: 'status',
                  headerName: 'Status',
                  flex: 0.8,
                  renderCell: ({ row }: { row: BOQ }) => <StatusChip status={row.status} />,
                },
                {
                  field: 'updated_at',
                  headerName: 'Last Updated',
                  flex: 1,
                  renderCell: ({ row }: { row: BOQ }) => formatDate(row.updated_at),
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
                  renderCell: ({ row }: { row: BOQ }) => (
                    <RowActionsMenu
                      actions={[
                        {
                          key: 'view',
                          label: 'View',
                          icon: <VisibilityIcon fontSize="small" />,
                          onClick: () => router.push(`/boq/${row.id}`),
                        },
                        {
                          key: 'variance',
                          label: 'View variance',
                          icon: <BarChartIcon fontSize="small" />,
                          onClick: () => router.push(`/boq/${row.id}/variance`),
                        },
                      ]}
                    />
                  ),
                },
              ]}
              rowCount={groupBoqs.length}
              paginationModel={{ page: 0, pageSize: 10 }}
              onPaginationModelChange={() => {}}
            />
          </Paper>
        ))
      )}
    </Box>
  );
}
