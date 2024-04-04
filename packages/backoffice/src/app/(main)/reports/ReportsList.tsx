'use client';

import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import DataGrid from '#components/DataGrid';
import type { GridColDef } from '@mui/x-data-grid';

type ReportItem = {
  targetId: string;
  targetType: string;
  count: number;
};

type ReportListProps = {
  reports: ReportItem[];
  count: number;
  page: number;
  pageSize: number;
  sortField: 'targetId' | 'targetType';
  sortOrder: 'asc' | 'desc';
};

const ReportsList = ({ reports, count, pageSize }: ReportListProps) => {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Moderation
      </Typography>

      <DataGrid
        columns={columns}
        rows={reports}
        rowCount={count}
        pageSizeOptions={[pageSize]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
        getRowId={row => `${row.targetId}-${row.targetType}`}
        onRowClick={params => {
          router.push(
            `/reports/${params.row.targetType}/${params.row.targetId}`,
          );
        }}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          },
        }}
      />
    </Box>
  );
};

const columns: GridColDef[] = [
  {
    field: 'targetType',
    headerName: 'Type',
    flex: 1,
  },
  {
    field: 'count',
    headerName: 'Report count',
    width: 250,
  },
];

export default ReportsList;
