'use client';

import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import DataGrid from '#components/DataGrid';
import type {
  Filters,
  ModerationItem,
  ReportKind,
  ReportStatus,
  SortFields,
} from './page';
import type { SelectChangeEvent } from '@mui/material';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';

type ModerationListProps = {
  reports: ModerationItem[];
  count: number;
  page: number;
  pageSize: number;
  sortField: SortFields;
  sortOrder: 'asc' | 'desc';
  filters: Filters;
};

const ModerationsList = ({
  reports,
  page,
  count,
  pageSize,
  sortField,
  sortOrder,
  filters,
}: ModerationListProps) => {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState(filters.status);
  const [kindFilter, setKindFilter] = useState(filters.kind);

  const updateSearchParams = useCallback(
    (page: number, sort: string, order: string, filters: Filters) => {
      startTransition(() => {
        router.replace(
          `/moderations?page=${page}&sort=${sort}&order=${order}&status=${filters?.status ?? ''}&kind=${filters?.kind ?? ''}`,
        );
      });
    },
    [router, startTransition],
  );

  const onPageChange = useCallback(
    (model: GridPaginationModel) => {
      updateSearchParams(model.page + 1, sortField, sortOrder, {
        status: statusFilter,
        kind: kindFilter,
      });
    },
    [kindFilter, sortField, sortOrder, statusFilter, updateSearchParams],
  );

  const onSortModelChange = useCallback(
    (model: GridSortModel) => {
      updateSearchParams(page, model[0].field, model[0].sort ?? 'asc', {
        status: statusFilter,
        kind: kindFilter,
      });
    },
    [kindFilter, page, statusFilter, updateSearchParams],
  );

  const onStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const newStatus = event.target.value as ReportStatus;
      setStatusFilter(newStatus);
      updateSearchParams(1, sortField, sortOrder, {
        status: newStatus,
        kind: kindFilter,
      });
    },
    [kindFilter, sortField, sortOrder, updateSearchParams],
  );

  const onKindChange = useCallback(
    (event: SelectChangeEvent) => {
      const newKind = event.target.value as ReportKind;
      setKindFilter(newKind);
      updateSearchParams(1, sortField, sortOrder, {
        status: statusFilter,
        kind: newKind,
      });
    },
    [sortField, sortOrder, statusFilter, updateSearchParams],
  );

  useEffect(() => {
    if (filters.status !== statusFilter) {
      setStatusFilter(filters.status);
    }
    if (filters.kind !== kindFilter) {
      setKindFilter(filters.kind);
    }
  }, [filters, kindFilter, statusFilter]);

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

      <Box display="flex" alignItems="center" gap={2} mb={2} mt={2}>
        <FormControl sx={{ width: 130 }}>
          <InputLabel id="status">Status</InputLabel>
          <Select
            labelId="status"
            id="status"
            value={statusFilter}
            label="Status"
            onChange={onStatusChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="open">Opened</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ width: 130 }}>
          <InputLabel id="kind">Kind</InputLabel>
          <Select
            labelId="kind"
            id="kind"
            value={kindFilter}
            label="Kind"
            onChange={onKindChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="webCard">webCard</MenuItem>
            <MenuItem value="post">post</MenuItem>
            <MenuItem value="comment">comment</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DataGrid
        columns={columns}
        rows={reports}
        rowCount={count}
        initialState={{
          pagination: {
            paginationModel: { pageSize, page: page - 1 },
          },
        }}
        sortModel={[
          {
            field: sortField,
            sort: sortOrder,
          },
        ]}
        pageSizeOptions={[pageSize]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
        getRowId={row => `${row.targetId}-${row.targetType}`}
        onRowClick={params => {
          router.push(
            `/moderations/${params.row.targetType}/${params.row.targetId}`,
          );
        }}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          },
        }}
        sortingMode="server"
        paginationMode="server"
        onSortModelChange={onSortModelChange}
        onPaginationModelChange={onPageChange}
        loading={loading}
      />
    </Box>
  );
};

const columns: GridColDef[] = [
  {
    field: 'targetId',
    headerName: 'ID',
    flex: 1,
  },
  {
    field: 'reportCount',
    headerName: 'Reports',
    flex: 1,
  },
  {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    renderCell: params => (
      <Chip
        color={params.value === 'open' ? 'warning' : 'default'}
        label={params.value === 'open' ? 'Opened' : 'Closed'}
      />
    ),
  },
  {
    field: 'targetType',
    headerName: 'Kind',
    flex: 1,
    renderCell: params => <Chip label={params.value} />,
  },
  {
    field: 'latestReport',
    headerName: 'Latest report',
    type: 'date',
    valueGetter: value => (value ? new Date(value) : null),
    flex: 1,
  },
];

export default ModerationsList;
