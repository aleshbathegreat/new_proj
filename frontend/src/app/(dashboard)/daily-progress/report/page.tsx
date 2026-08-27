// src/app/(dashboard)/daily-progress/report/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormLabel from '@mui/material/FormLabel';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { tokenService } from '@/services/tokenService';
import {
  useGetProgressSummaryProjectsQuery,
  useGetProgressSummaryProjectDistrictsQuery,
  useGetProgressSummaryDistrictSitesQuery,
  getProgressExportUrl,
  type ProgressSummaryRow,
  type ProgressActivityBreakdown,
} from '@/store/api/progressApi';

type Level = 'projects' | 'districts' | 'sites';

const COLORS = ['#1976d2', '#e0e0e0'];

function ProgressDonut({ percent }: { percent: number }) {
  const data = [
    { name: 'Done', value: Math.min(100, percent) },
    { name: 'Remaining', value: Math.max(0, 100 - percent) },
  ];
  return (
    <Box sx={{ position: 'relative', width: 96, height: 96 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={32}
            outerRadius={44}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {percent.toFixed(0)}%
        </Typography>
      </Box>
    </Box>
  );
}

function SummaryCard({
  row,
  onClick,
}: {
  row: ProgressSummaryRow;
  onClick?: () => void;
}) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': onClick ? { boxShadow: 4, transform: 'translateY(-2px)' } : undefined,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1.5 }}>
        <ProgressDonut percent={row.percent_complete} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
            {row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.tasks_count} task{row.tasks_count === 1 ? '' : 's'} ·{' '}
            {row.actual_total.toLocaleString()} / {row.planned_total.toLocaleString()} planned
          </Typography>
        </Box>
      </Box>

      {row.breakdown.length > 0 && (
        <Box sx={{ height: Math.max(80, row.breakdown.length * 28) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={row.breakdown} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis
                type="category"
                dataKey="label"
                width={110}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, _name, props) => {
                  const payload = props.payload as ProgressActivityBreakdown;
                  return [
                    `${Number(value)}% (${payload.actual.toLocaleString()} / ${payload.planned.toLocaleString()} ${payload.unit})`,
                    'Complete',
                  ];
                }}
              />
              <Bar dataKey="percent_complete" fill="#1976d2" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}

function DownloadDialog({
  open,
  onClose,
  level,
  projectId,
  districtId,
  rows,
}: {
  open: boolean;
  onClose: () => void;
  level: Level;
  projectId: string | null;
  districtId: string | null;
  rows: ProgressSummaryRow[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [includeBreakdown, setIncludeBreakdown] = useState(true);
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('xlsx');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const rowId = (r: ProgressSummaryRow) => r.project_id ?? r.district_id ?? r.site_id ?? 'none';

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(rows.map(rowId)) : new Set());
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
      const path = getProgressExportUrl({
        scope: level,
        format,
        project_id: level === 'districts' ? projectId ?? undefined : undefined,
        district_id: level === 'sites' ? districtId ?? undefined : undefined,
        project_ids: level === 'projects' ? ids : undefined,
        district_ids: level === 'districts' ? ids : undefined,
        site_ids: level === 'sites' ? ids : undefined,
        include_breakdown: includeBreakdown,
      });

      const token = tokenService.getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

      const response = await fetch(`${baseUrl}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `progress_report_${level}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      onClose();
    } catch (e) {
      setError((e as Error)?.message || 'Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Download Progress Report</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormLabel sx={{ mb: 1, display: 'block' }}>Include</FormLabel>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedIds.size === rows.length && rows.length > 0}
              indeterminate={selectedIds.size > 0 && selectedIds.size < rows.length}
              onChange={(e) => toggleAll(e.target.checked)}
            />
          }
          label="Select all"
        />
        <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
          {rows.map((r) => (
            <FormControlLabel
              key={rowId(r)}
              sx={{ display: 'block', ml: 2 }}
              control={
                <Checkbox
                  checked={selectedIds.has(rowId(r))}
                  onChange={() => toggleOne(rowId(r))}
                />
              }
              label={r.name}
            />
          ))}
        </Box>

        <FormControlLabel
          sx={{ mt: 2, display: 'block' }}
          control={
            <Checkbox
              checked={includeBreakdown}
              onChange={(e) => setIncludeBreakdown(e.target.checked)}
            />
          }
          label="Include per-activity breakdown"
        />

        <FormLabel sx={{ mt: 2, mb: 1, display: 'block' }}>Format</FormLabel>
        <RadioGroup row value={format} onChange={(e) => setFormat(e.target.value as 'pdf' | 'xlsx')}>
          <FormControlLabel value="xlsx" control={<Radio />} label="Excel (.xlsx)" />
          <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={downloading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Downloading…' : 'Download'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ProgressReportPage() {
  const router = useRouter();
  const [level, setLevel] = useState<Level>('projects');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [districtName, setDistrictName] = useState('');
  const [downloadOpen, setDownloadOpen] = useState(false);

  useEffect(() => {
    document.title = 'Progress Report | SC-GIMS';
  }, []);

  const { data: projectsData, isLoading: loadingProjects } = useGetProgressSummaryProjectsQuery(
    undefined,
    { skip: level !== 'projects' }
  );
  const { data: districtsData, isLoading: loadingDistricts } = useGetProgressSummaryProjectDistrictsQuery(
    projectId ?? '',
    { skip: level !== 'districts' || !projectId }
  );
  const { data: sitesData, isLoading: loadingSites } = useGetProgressSummaryDistrictSitesQuery(
    districtId ?? '',
    { skip: level !== 'sites' || !districtId }
  );

  const goToProjects = () => {
    setLevel('projects');
    setProjectId(null);
    setDistrictId(null);
  };
  const goToDistricts = (id: string, name: string) => {
    setProjectId(id);
    setProjectName(name);
    setLevel('districts');
    setDistrictId(null);
  };
  const goToSites = (id: string, name: string) => {
    setDistrictId(id);
    setDistrictName(name);
    setLevel('sites');
  };

  const rows =
    level === 'projects' ? projectsData?.data ?? []
    : level === 'districts' ? districtsData?.data ?? []
    : sitesData?.data ?? [];

  const loading =
    (level === 'projects' && loadingProjects) ||
    (level === 'districts' && loadingDistricts) ||
    (level === 'sites' && loadingSites);

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/daily-progress')}>
          Back to Work Progress
        </Button>
        <Button
          startIcon={<DownloadIcon />}
          variant="outlined"
          onClick={() => setDownloadOpen(true)}
          disabled={rows.length === 0}
        >
          Download Report
        </Button>
      </Stack>

      <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
        Progress Report
      </Typography>

      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          underline={level === 'projects' ? 'none' : 'hover'}
          color={level === 'projects' ? 'text.primary' : 'inherit'}
          onClick={goToProjects}
        >
          Projects
        </Link>
        {projectId && (
          <Link
            component="button"
            underline={level === 'districts' ? 'none' : 'hover'}
            color={level === 'districts' ? 'text.primary' : 'inherit'}
            onClick={() => setLevel('districts')}
          >
            {projectName}
          </Link>
        )}
        {districtId && level === 'sites' && <Typography color="text.primary">{districtName}</Typography>}
      </Breadcrumbs>

      {loading ? (
        <PageSkeleton />
      ) : rows.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No progress data at this level yet.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {rows.map((row) => (
            <Grid key={row.project_id ?? row.district_id ?? row.site_id ?? row.name} size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard
                row={row}
                onClick={
                  level === 'projects' && row.project_id
                    ? () => goToDistricts(row.project_id!, row.name)
                    : level === 'districts' && row.district_id
                    ? () => goToSites(row.district_id!, row.name)
                    : undefined
                }
              />
            </Grid>
          ))}
        </Grid>
      )}

      <DownloadDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        level={level}
        projectId={projectId}
        districtId={districtId}
        rows={rows}
      />
    </Box>
  );
}