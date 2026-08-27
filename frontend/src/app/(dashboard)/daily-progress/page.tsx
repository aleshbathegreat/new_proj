'use client';

import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DataTable from '@/components/organisms/DataTable';
import Toast from '@/components/atoms/Toast';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { usePermission } from '@/hooks/usePermission';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useGetDistrictsQuery } from '@/store/api/provinceApi';
import { useGetSitesQuery } from '@/store/api/siteApi';
import {
  useCreateDailyProgressMutation,
  useGetDailyProgressQuery,
  useGetSiteProgressTasksQuery,
} from '@/store/api/progressApi';
import type { DailyProgressEntry, SiteProgressTask } from '@/types/dailyProgress';
import { formatDate } from '@/utils/formatDate';

/** Sentinel value for the Site dropdown meaning "district-level, no specific site". */
const DISTRICT_LEVEL_VALUE = 'none';

const progressSchema = z.object({
  site_task_id: z.string().uuid('Select a task'),
  date: z.string().min(1, 'Date is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  remarks: z.string().optional(),
});

type ProgressFormData = z.input<typeof progressSchema>;

export default function DailyProgressPage() {
  const { canCreate } = useCrudPermission('/daily-progress');
  const { hasAnyRole } = usePermission();
  const canManageTasks = hasAnyRole(['SYSTEM_ADMIN', 'HOD', 'DIR']);

  const [showForm, setShowForm] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [siteId, setSiteId] = useState(''); // '' = not chosen, DISTRICT_LEVEL_VALUE = district-level, else a real site id

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'warning' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const { data: projectsData, isLoading: loadingProjects } = useGetProjectsQuery({ page_size: 200 });
  const projects = projectsData?.data ?? [];
  const selectedProject = projects.find((p) => p.id === projectId);

  const { data: districtsData, isLoading: loadingDistricts } = useGetDistrictsQuery(
    { province_id: selectedProject?.province_id, page_size: 200 },
    { skip: !selectedProject?.province_id }
  );
  const districts = districtsData?.data ?? [];

  const { data: sitesData, isLoading: loadingSites } = useGetSitesQuery(
    { project_id: projectId, district_id: districtId, page_size: 200 },
    { skip: !projectId || !districtId }
  );
  const sites = sitesData?.data ?? [];

  const isDistrictLevel = siteId === DISTRICT_LEVEL_VALUE;
  const scopeReady = !!projectId && !!districtId && !!siteId;
  const scopeName = isDistrictLevel
    ? districts.find((d) => d.id === districtId)?.name ?? 'district'
    : sites.find((s) => s.id === siteId)?.name ?? 'site';

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      site_task_id: '',
      date: new Date().toISOString().slice(0, 10),
      quantity: '',
      remarks: '',
    },
  });

  const siteTaskId = watch('site_task_id');
  const quantityStr = watch('quantity');

  const { data: tasksData, isLoading: loadingTasks } = useGetSiteProgressTasksQuery(
    { project_id: projectId, district_id: districtId, site_id: siteId, is_active: 'true', page_size: 100 },
    { skip: !scopeReady }
  );
  const tasks = tasksData?.data ?? [];

  const { data: entriesData, isLoading: loadingEntries, refetch } = useGetDailyProgressQuery(
    { project_id: projectId, district_id: districtId, site_id: siteId, page_size: 100 },
    { skip: !scopeReady }
  );
  const entries = entriesData?.data ?? [];

  const [createEntry, { isLoading: saving }] = useCreateDailyProgressMutation();

  const selectedTask = tasks.find((t) => t.id === siteTaskId);

  const projectedCumulative = useMemo(() => {
    if (!selectedTask) return 0;
    const qty = Number(quantityStr) || 0;
    return Number(selectedTask.cumulative_quantity || 0) + qty;
  }, [selectedTask, quantityStr]);

  const planned = Number(selectedTask?.planned_quantity || 0);
  const overPlan = planned > 0 && projectedCumulative > planned;

  useEffect(() => {
    document.title = 'Work Progress | SC-GIMS';
  }, []);

  useEffect(() => {
    setDistrictId('');
    setSiteId('');
  }, [projectId]);

  useEffect(() => {
    setSiteId('');
  }, [districtId]);

  useEffect(() => {
    setValue('site_task_id', '');
  }, [siteId, setValue]);

  if (loadingProjects) return <PageSkeleton />;

  const onSubmit = async (data: ProgressFormData) => {
    let saveSucceeded = false;
    try {
      await createEntry({
        site_task_id: data.site_task_id,
        date: data.date,
        quantity: Number(data.quantity) || 0,
        remarks: data.remarks || '',
        kpi_values: {},
      }).unwrap();
      saveSucceeded = true;
    } catch (e) {
      console.error('Daily progress save failed:', e);
      setToast({
        open: true,
        message:
          (e as { data?: { detail?: string; non_field_errors?: string[] } })?.data?.detail ||
          (e as { data?: { non_field_errors?: string[] } })?.data?.non_field_errors?.[0] ||
          'Failed to save (duplicate date for this task?)',
        severity: 'error',
      });
      return;
    }

    // Only reached if the mutation itself actually succeeded.
    if (saveSucceeded) {
      setToast({
        open: true,
        message: overPlan
          ? 'Saved — cumulative exceeds planned quantity'
          : 'Daily progress saved',
        severity: overPlan ? 'warning' : 'success',
      });
      reset({
        site_task_id: '',
        date: data.date,
        quantity: '',
        remarks: '',
      });
      setShowForm(false);
      refetch();
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Typography variant="h5" component="h1">
            Work Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Log quantity against configured tasks, per site or at the district level.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {canManageTasks && (
            <Button component={Link} href="/admin/progress-tasks" variant="outlined">
              Manage tasks
            </Button>
          )}
          {canManageTasks && (
            <Button component={Link} href="/daily-progress/report" variant="outlined">
              Progress Report
            </Button>
          )}
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm((v) => !v)}
              disabled={!scopeReady}
            >
              {showForm ? 'Close' : 'Log progress'}
            </Button>
          )}
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label="Project"
            size="small"
            sx={{ minWidth: 240 }}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <MenuItem value="">Select project</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="District"
            size="small"
            sx={{ minWidth: 200 }}
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            disabled={!projectId || loadingDistricts}
          >
            <MenuItem value="">Select district</MenuItem>
            {districts.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Site"
            size="small"
            sx={{ minWidth: 260 }}
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            disabled={!districtId || loadingSites}
          >
            <MenuItem value="">Select site</MenuItem>
            <MenuItem value={DISTRICT_LEVEL_VALUE}>
              <em>— District level (no specific site) —</em>
            </MenuItem>
            {sites.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {!scopeReady ? (
        <Alert severity="info">
          Select a Project and District, then either pick a Site or choose &quot;District level&quot; to view its progress.
        </Alert>
      ) : (
        <>
          {showForm && canCreate && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                New entry — {scopeName}
              </Typography>
              {loadingTasks ? (
                <PageSkeleton />
              ) : tasks.length === 0 ? (
                <Alert severity="warning">
                  No active tasks for this {isDistrictLevel ? 'district' : 'site'}.{' '}
                  {canManageTasks ? (
                    <Link href="/tasks">Assign tasks in Tasks</Link>
                  ) : (
                    'Ask an admin to assign progress tasks.'
                  )}
                </Alert>
              ) : (
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                  <Stack spacing={2}>
                    <Controller
                      name="site_task_id"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Task / KPI"
                          fullWidth
                          error={!!errors.site_task_id}
                          helperText={errors.site_task_id?.message}
                        >
                          {tasks.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                              {t.name} ({t.key})
                              {t.boq_item_code ? ` · BOQ ${t.boq_item_code}` : ''} — planned{' '}
                              {Number(t.planned_quantity).toLocaleString()} {t.unit}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />

                    {selectedTask && (
                      <Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                          <Chip size="small" label={selectedTask.category || 'Task'} />
                          {selectedTask.boq_item_code && (
                            <Chip
                              size="small"
                              color="primary"
                              variant="outlined"
                              label={`BOQ ${selectedTask.boq_item_code}`}
                              component={Link}
                              href={selectedTask.boq_id ? `/boq/${selectedTask.boq_id}` : '/boq'}
                              clickable
                            />
                          )}
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`${Number(selectedTask.cumulative_quantity).toLocaleString()} / ${Number(selectedTask.planned_quantity).toLocaleString()} ${selectedTask.unit}`}
                          />
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={
                            planned > 0
                              ? Math.min(100, (Number(selectedTask.cumulative_quantity) / planned) * 100)
                              : 0
                          }
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>
                    )}

                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="date"
                          label="Date"
                          slotProps={{ inputLabel: { shrink: true } }}
                          fullWidth
                          error={!!errors.date}
                          helperText={errors.date?.message}
                        />
                      )}
                    />

                    <Controller
                      name="quantity"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          label={`Quantity today (${selectedTask?.unit || 'unit'})`}
                          fullWidth
                          error={!!errors.quantity}
                          helperText={
                            errors.quantity?.message ||
                            (selectedTask
                              ? `Projected cumulative: ${projectedCumulative.toLocaleString()} ${selectedTask.unit}`
                              : undefined)
                          }
                        />
                      )}
                    />

                    {overPlan && (
                      <Alert severity="warning">
                        This entry would push cumulative above the planned quantity for this task.
                      </Alert>
                    )}

                    <Controller
                      name="remarks"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label="Remarks" fullWidth multiline minRows={2} />
                      )}
                    />

                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button onClick={() => setShowForm(false)}>Cancel</Button>
                      <Button type="submit" variant="contained" disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              )}
            </Paper>
          )}

          <Typography variant="h6" sx={{ mb: 1 }}>
            {scopeName} task status
          </Typography>
          {loadingTasks ? (
            <PageSkeleton />
          ) : (
            <Paper sx={{ p: 2, mb: 3, overflowX: 'auto' }}>
              <Stack spacing={1.5}>
                {tasks.map((t: SiteProgressTask) => {
                  const done = Number(t.cumulative_quantity);
                  const plan = Number(t.planned_quantity);
                  const pct = plan > 0 ? Math.min(100, (done / plan) * 100) : 0;
                  return (
                    <Box key={t.id}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mb: 0.5, justifyContent: 'space-between', flexWrap: 'wrap' }}
                      >
                        <Typography variant="body2">
                          <strong>{t.name}</strong>{' '}
                          <Typography component="span" variant="caption" color="text.secondary">
                            [{t.key}]
                            {t.boq_item_code ? ` · BOQ ${t.boq_item_code}` : ''}
                          </Typography>
                        </Typography>
                        <Typography variant="caption">
                          {done.toLocaleString()} / {plan.toLocaleString()} {t.unit}
                        </Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 1 }} />
                    </Box>
                  );
                })}
                {tasks.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No tasks assigned to this {isDistrictLevel ? 'district' : 'site'} yet.
                  </Typography>
                )}
              </Stack>
            </Paper>
          )}

          <Typography variant="h6" sx={{ mb: 1 }}>
            Recent entries
          </Typography>
          {loadingEntries ? (
            <PageSkeleton />
          ) : (
            <DataTable
              rows={entries}
              columns={[
                {
                  field: 'date',
                  headerName: 'Date',
                  flex: 0.8,
                  renderCell: ({ row }: { row: DailyProgressEntry }) => formatDate(row.date),
                },
                { field: 'task_name', headerName: 'Task', flex: 1.1 },
                { field: 'task_key', headerName: 'Key', flex: 0.7 },
                {
                  field: 'boq_item_code',
                  headerName: 'BOQ Item',
                  flex: 0.9,
                  renderCell: ({ row }: { row: DailyProgressEntry }) =>
                    row.boq_item_id ? (
                      <Link href={`/boq-items/${row.boq_item_id}`}>
                        {row.boq_item_code || 'View item'}
                      </Link>
                    ) : (
                      '—'
                    ),
                },
                {
                  field: 'quantity',
                  headerName: 'Qty',
                  flex: 0.6,
                  renderCell: ({ row }: { row: DailyProgressEntry }) =>
                    `${Number(row.quantity).toLocaleString()} ${row.task_unit}`,
                },
                {
                  field: 'cumulative_quantity',
                  headerName: 'Cumulative',
                  flex: 0.7,
                  renderCell: ({ row }: { row: DailyProgressEntry }) =>
                    Number(row.cumulative_quantity).toLocaleString(),
                },
                {
                  field: 'planned_quantity',
                  headerName: 'Planned',
                  flex: 0.6,
                  renderCell: ({ row }: { row: DailyProgressEntry }) =>
                    Number(row.planned_quantity).toLocaleString(),
                },
                { field: 'submitted_by_name', headerName: 'By', flex: 1 },
                {
                  field: 'remarks',
                  headerName: 'Remarks',
                  flex: 1.2,
                  renderCell: ({ row }: { row: DailyProgressEntry }) => row.remarks || '—',
                },
              ]}
              rowCount={entries.length}
              paginationModel={{ page: 0, pageSize: 25 }}
              onPaginationModelChange={() => {}}
            />
          )}
        </>
      )}

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </Box>
  );
}