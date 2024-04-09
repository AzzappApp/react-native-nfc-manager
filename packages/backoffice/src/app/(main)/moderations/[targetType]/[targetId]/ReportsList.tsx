'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import DataGrid from '#components/DataGrid';
import type { Report } from '@azzapp/data';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';

type ReportListProps = {
  reports: Report[];
  count: number;
  page: number;
  pageSize: number;
};

const ReportsList = ({ reports, count, page, pageSize }: ReportListProps) => {
  const router = useRouter();
  const { targetType, targetId } = useParams();
  const [loading, startTransition] = useTransition();
  const updateSearchParams = useCallback(
    (page: number) => {
      startTransition(() => {
        router.replace(`/moderations/${targetType}/${targetId}?page=${page}`);
      });
    },
    [router, targetId, targetType],
  );

  const onPageChange = (model: GridPaginationModel) => {
    updateSearchParams(model.page + 1);
  };

  return (
    <DataGrid
      columns={columns}
      rows={reports}
      rowCount={count}
      initialState={{
        pagination: {
          paginationModel: { pageSize, page: page - 1 },
        },
      }}
      getRowId={row => row.userId}
      paginationMode="server"
      onPaginationModelChange={onPageChange}
      loading={loading}
    />
  );
};

const columns: GridColDef[] = [
  {
    field: 'userId',
    headerName: 'Created By',
    flex: 2,
    renderCell: params => (
      <a href={`/users/${params.row.userId}`}>{params.row.userId}</a>
    ),
  },
  {
    field: 'treatedBy',
    headerName: 'Treated By',
    flex: 2,
    renderCell: params => (
      <a href={`/users/${params.row.treatedBy}`}>{params.row.treatedBy}</a>
    ),
  },
  {
    field: 'treatedAt',
    headerName: 'Treated Date',
    type: 'date',
    flex: 1,
  },
  {
    field: 'createdAt',
    headerName: 'Date',
    type: 'date',
    flex: 1,
  },
];

export default ReportsList;
