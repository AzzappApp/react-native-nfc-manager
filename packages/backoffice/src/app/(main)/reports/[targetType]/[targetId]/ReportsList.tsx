'use client';

import DataGrid from '#components/DataGrid';
import type { Report } from '@azzapp/data/domains/report';
import type { GridColDef } from '@mui/x-data-grid';

type ReportListProps = {
  reports: Report[];
};

const ReportsList = ({ reports }: ReportListProps) => {
  return (
    <DataGrid
      columns={columns}
      rows={reports}
      rowCount={reports.length}
      getRowId={row => row.userId}
    />
  );
};

const columns: GridColDef[] = [
  {
    field: 'userId',
    headerName: 'User ID',
    width: 250,
    renderCell: params => (
      <a href={`/users/${params.row.userId}`}>{params.row.userId}</a>
    ),
  },
  {
    field: 'treatedBy',
    headerName: 'Treated by',
    width: 250,
    renderCell: params => (
      <a href={`/users/${params.row.treatedBy}`}>{params.row.treatedBy}</a>
    ),
  },
  {
    field: 'treatedAt',
    headerName: 'Treated At',
  },
];

export default ReportsList;
