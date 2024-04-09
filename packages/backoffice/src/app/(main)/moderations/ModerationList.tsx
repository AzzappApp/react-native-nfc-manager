'use client';

import { Search } from '@mui/icons-material';
import {
  Box,
  Chip,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from 'react';
import DataGrid from '#components/DataGrid';
import type { ModerationItem } from './page';
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
  sortField: 'targetId' | 'targetType';
  sortOrder: 'asc' | 'desc';
  search: string | null;
};

const ModerationsList = ({
  reports,
  page,
  count,
  pageSize,
  sortField,
  sortOrder,
  search,
}: ModerationListProps) => {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const updateSearchParams = useCallback(
    (page: number, sort: string, order: string, search: string | null) => {
      startTransition(() => {
        router.replace(
          `/moderations?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}`,
        );
      });
    },
    [router, startTransition],
  );

  const onPageChange = (model: GridPaginationModel) => {
    updateSearchParams(model.page + 1, sortField, sortOrder, search);
  };

  const onSortModelChange = (model: GridSortModel) => {
    if (!model.length) {
      updateSearchParams(page, 'createdAt', 'desc', search);
      return;
    }
    updateSearchParams(page, model[0].field, model[0].sort ?? 'asc', search);
  };

  const [currentSearch, setCurrentSearch] = useState(search ?? '');

  const defferedSearch = useDeferredValue(currentSearch);

  useEffect(() => {
    if (search === defferedSearch) {
      return;
    }
    updateSearchParams(1, sortField, sortOrder, defferedSearch);
  }, [defferedSearch, page, search, sortField, sortOrder, updateSearchParams]);

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

      <TextField
        margin="normal"
        name="search"
        label="Search"
        type="text"
        onChange={e => setCurrentSearch(e.target.value)}
        value={currentSearch}
        sx={{ mb: 2, width: 500 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

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
    field: 'url',
    headerName: 'Url',
    flex: 1,
    renderCell: () => 'url',
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
        color={params.value === 'Opened' ? 'warning' : 'default'}
        label={params.value}
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
    valueGetter: params => (params.value ? new Date(params.value) : null),
    flex: 1,
  },
];

export default ModerationsList;
