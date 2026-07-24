'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';

interface DataTableProps<T> {
  rows: T[];
  columns: GridColDef[];
  rowCount: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable<T extends { id: string | number }>({
  rows,
  columns,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  loading = false,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
        slots={{
          noRowsOverlay: () => (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
              <Typography color="text.secondary">{emptyMessage}</Typography>
            </Box>
          ),
        }}
      />
    </Box>
  );
}
