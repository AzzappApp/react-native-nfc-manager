'use client';

import { Search } from '@mui/icons-material';
import {
  Box,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns/format';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from 'react';
import DataGrid from '#components/DataGrid';
import type { SortColumn, Status, Type } from './page';
import type { UserSubscription } from '@azzapp/data';
import type { SelectChangeEvent } from '@mui/material';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';

type SubscriptionListProps = {
  subscriptions: UserSubscription[];
  count: number;
  page: number;
  pageSize: number;
  sortField: SortColumn;
  sortOrder: 'asc' | 'desc';
  search: string | null;
  filters: {
    status: Status | 'all';
    type: Type | 'all';
  };
};

const SubscriptionList = ({
  subscriptions,
  count,
  page,
  pageSize,
  sortField,
  sortOrder,
  search,
  filters,
}: SubscriptionListProps) => {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const [currentSearch, setCurrentSearch] = useState(search ?? '');
  const defferedSearch = useDeferredValue(currentSearch);
  const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
  const [typeFilter, setTypeFilter] = useState(filters?.type || 'all');

  const updateSearchParams = useCallback(
    (
      page: number,
      sort: string,
      order: string,
      search: string | null,
      filters: {
        status: Status | 'all';
        type: Type | 'all';
      },
    ) => {
      startTransition(() => {
        router.replace(
          `/subscriptions?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}&st=${filters.status ?? ''}&t=${filters.type ?? ''}`,
        );
      });
    },
    [router, startTransition],
  );

  const onPageChange = useCallback(
    (model: GridPaginationModel) => {
      updateSearchParams(model.page + 1, sortField, sortOrder, search, {
        status: statusFilter,
        type: typeFilter,
      });
    },
    [
      search,
      sortField,
      sortOrder,
      statusFilter,
      typeFilter,
      updateSearchParams,
    ],
  );

  const onSortModelChange = useCallback(
    (model: GridSortModel) => {
      updateSearchParams(
        page,
        model[0]?.field ?? 'label',
        model[0]?.sort ?? 'asc',
        search,
        { status: statusFilter, type: typeFilter },
      );
    },
    [page, search, statusFilter, typeFilter, updateSearchParams],
  );

  useEffect(() => {
    if (search === defferedSearch) {
      return;
    }
    updateSearchParams(1, sortField, sortOrder, defferedSearch, {
      status: statusFilter,
      type: typeFilter,
    });
  }, [
    defferedSearch,
    page,
    search,
    sortField,
    sortOrder,
    statusFilter,
    typeFilter,
    updateSearchParams,
  ]);

  const onStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const newStatus = event.target.value as Status;
      setStatusFilter(newStatus);
      updateSearchParams(1, sortField, sortOrder, search, {
        status: newStatus,
        type: typeFilter,
      });
    },
    [search, sortField, sortOrder, typeFilter, updateSearchParams],
  );
  const onTypeChange = useCallback(
    (event: SelectChangeEvent) => {
      const newType = event.target.value as Type;
      setTypeFilter(newType);
      updateSearchParams(1, sortField, sortOrder, search, {
        status: statusFilter,
        type: newType,
      });
    },
    [search, sortField, sortOrder, statusFilter, updateSearchParams],
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Subscriptions
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            margin="normal"
            name="search"
            label="Search"
            type="text"
            onChange={e => setCurrentSearch(e.target.value)}
            value={currentSearch}
            sx={{ mb: 2, width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ width: 130 }}>
            <InputLabel id="status">Status</InputLabel>
            <Select
              labelId="status"
              id="status"
              value={statusFilter}
              label="Status"
              onChange={onStatusChange}
            >
              <MenuItem value="all">all</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="canceled">Canceled</MenuItem>
              <MenuItem value="waiting_payment">Waiting Payment</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ width: 130 }}>
            <InputLabel id="type">Type</InputLabel>
            <Select
              labelId="type"
              id="type"
              value={typeFilter}
              label="Type"
              onChange={onTypeChange}
            >
              <MenuItem value="all">all</MenuItem>
              <MenuItem value="web.monthly">Monthly</MenuItem>
              <MenuItem value="web.yearly">Yearly</MenuItem>
              <MenuItem value="web.lifetime">LifeTime</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <DataGrid
        columns={columns}
        rows={subscriptions}
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
        onRowClick={params => {
          router.push(`/users/${params.row.userId}`);
        }}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          },
        }}
        paginationMode="server"
        sortingMode="server"
        onPaginationModelChange={onPageChange}
        onSortModelChange={onSortModelChange}
        loading={loading}
        pageSizeOptions={[pageSize]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
      />
    </Box>
  );
};

const columns: GridColDef[] = [
  {
    field: 'issuer',
    headerName: 'issuer',
    width: 80,
  },
  {
    field: 'subscriptionPlan',
    headerName: 'Type',
    width: 100,
    valueGetter: (value: string) => value?.replace('web.', '') || '',
  },
  {
    field: 'userId',
    headerName: 'Account',
    flex: 1,
  },
  {
    field: 'webCardId',
    headerName: 'WebCard',
    flex: 1,
  },
  {
    field: 'amount',
    headerName: 'Billed for',
    flex: 1,
    valueGetter: (value: number, row) =>
      `${((value + row.taxes) / 100).toFixed(2)}€ (${row.totalSeats} users)`,
  },
  {
    field: 'freeSeats',
    headerName: 'Extra seats',
    width: 100,
  },
  {
    field: 'endAt',
    headerName: 'Next renewals',
    type: 'date',
    flex: 1,
    renderCell: params =>
      params.value > new Date() ? (
        format(params.value, 'MM/dd/yyyy')
      ) : (
        <Chip
          color="warning"
          label={`Expired since ${formatDistanceToNow(params.value)}`}
        />
      ),
  },
  {
    field: 'status',
    headerName: 'status',
    width: 100,
    renderCell: params => (
      <Chip
        color={params.value === 'active' ? 'default' : 'warning'}
        label={params.value}
      />
    ),
  },
];

export default SubscriptionList;
