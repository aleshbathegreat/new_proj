'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { useGetBoqItemsQuery, useGetBoqQuery } from '@/store/api/boqApi';
import { formatBoqNumber } from '@/lib/boq/spreadsheet';

export default function BOQVariancePage() {
  const params = useParams();
  const router = useRouter();
  const boqId = String(params.id);

  const { data: boq, isLoading, isError } = useGetBoqQuery(boqId);
  const { data: itemsData, isLoading: loadingItems } = useGetBoqItemsQuery(boqId);

  useEffect(() => {
    document.title = 'BOQ Variance | SC-GIMS';
  }, []);

  if (isLoading || loadingItems) return <PageSkeleton />;

  if (isError || !boq) {
    return (
      <Box>
        <Alert severity="error">BOQ not found.</Alert>
        <Button onClick={() => router.push('/boq')} sx={{ mt: 2 }}>
          Back to BOQ
        </Button>
      </Box>
    );
  }

  const items = itemsData?.data ?? [];
  const chartData = items.map((row) => ({
    name: row.item,
    Planned: Number(row.qty),
    Actual: Number(row.actual_quantity),
    Variance: Number(row.actual_quantity) - Number(row.qty),
  }));

  const over = items.filter((i) => Number(i.actual_quantity) > Number(i.qty)).length;
  const under = items.filter((i) => Number(i.actual_quantity) < Number(i.qty)).length;
  const onTrack = items.filter((i) => Number(i.actual_quantity) === Number(i.qty)).length;
  const totalDdpPkr = items.reduce((sum, i) => sum + Number(i.total_ddp_pkr || 0), 0);

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/boq/${boqId}`)}>
          Back to BOQ
        </Button>
        <Box>
          <Typography variant="h5">Variance — {boq.project_name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {boq.site_name || '-'} · TotalDDP PKR {formatBoqNumber(totalDdpPkr)}
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Over plan
          </Typography>
          <Typography variant="h5" color="error.main">
            {over}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Under plan
          </Typography>
          <Typography variant="h5" color="warning.main">
            {under}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            On track
          </Typography>
          <Typography variant="h5" color="success.main">
            {onTrack}
          </Typography>
        </Paper>
      </Stack>

      {items.length === 0 ? (
        <Alert severity="info">No items to compare.</Alert>
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 3, height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Planned" fill="#1976d2" />
                <Bar dataKey="Actual" fill="#2e7d32" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 2, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    'ITEM',
                    'ITEM TYPE',
                    'Item Description',
                    'UNIT',
                    'QTY',
                    'Actual',
                    'Variance',
                    'Variance %',
                    'TotalDDP PKR',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: 10,
                        textAlign: 'left',
                        borderBottom: '1px solid #ddd',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const variance = Number(row.actual_quantity) - Number(row.qty);
                  const variancePct =
                    Number(row.qty) === 0 ? '0.0' : ((variance / Number(row.qty)) * 100).toFixed(1);
                  const isOver = variance > 0;
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 10 }}>{row.item}</td>
                      <td style={{ padding: 10 }}>{row.item_type || '—'}</td>
                      <td style={{ padding: 10 }}>{row.item_description}</td>
                      <td style={{ padding: 10 }}>{row.unit}</td>
                      <td style={{ padding: 10 }}>{formatBoqNumber(row.qty)}</td>
                      <td style={{ padding: 10 }}>{formatBoqNumber(row.actual_quantity)}</td>
                      <td
                        style={{
                          padding: 10,
                          color: isOver ? '#d32f2f' : '#388e3c',
                          fontWeight: 600,
                        }}
                      >
                        {isOver ? '+' : ''}
                        {formatBoqNumber(variance)}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          color: isOver ? '#d32f2f' : '#388e3c',
                          fontWeight: 600,
                        }}
                      >
                        {isOver ? '+' : ''}
                        {variancePct}%
                      </td>
                      <td style={{ padding: 10 }}>{formatBoqNumber(row.total_ddp_pkr)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Paper>
        </>
      )}
    </Box>
  );
}
