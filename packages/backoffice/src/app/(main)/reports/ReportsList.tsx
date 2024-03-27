'use client';

import { Typography } from '@mui/material';
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

const ReportsList = ({ reports, count }: ReportListProps) => {
  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Reports
      </Typography>

      <DataGrid
        columns={columns}
        rows={reports}
        rowCount={count}
        pageSizeOptions={[25]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
        getRowId={row => `${row.targetId}-${row.targetType}`}
      />
    </>
  );
};

const columns: GridColDef[] = [
  {
    field: 'targetId',
    headerName: 'ID',
    width: 250,
    renderCell: params => (
      // Bypass cache to avoid getting out-of-date data
      <a href={`/reports/${params.row.targetType}/${params.row.targetId}`}>
        {params.row.targetId}
      </a>
    ),
  },
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
