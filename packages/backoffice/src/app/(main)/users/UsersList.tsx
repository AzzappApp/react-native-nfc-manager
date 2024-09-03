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
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from 'react';
import DataGrid from '#components/DataGrid';
import type { SortField, UserTable } from './page';
import type { SelectChangeEvent } from '@mui/material';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';

type UsersListProps = {
  users: UserTable[];
  count: number;
  page: number;
  pageSize: number;
  sortField: SortField;
  sortOrder: 'asc' | 'desc';
  search: string | null;
  enabledFilter: boolean | undefined;
};

const UsersList = ({
  users,
  count,
  page,
  pageSize,
  sortField,
  sortOrder,
  search,
  enabledFilter,
}: UsersListProps) => {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const [currentSearch, setCurrentSearch] = useState(search ?? '');
  const [statusFilter, setStatusFilter] = useState(
    enabledFilter === true
      ? 'Active'
      : enabledFilter === false
        ? 'Suspended'
        : 'All',
  );
  const deferredSearch = useDeferredValue(currentSearch);

  const updateSearchParams = useCallback(
    (
      page: number,
      sort: string,
      order: string,
      search: string | null,
      status: string | null,
    ) => {
      startTransition(() => {
        router.replace(
          `/users?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}&status=${status}`,
        );
      });
    },
    [router, startTransition],
  );

  const onPageChange = useCallback(
    (model: GridPaginationModel) => {
      updateSearchParams(
        model.page + 1,
        sortField,
        sortOrder,
        search,
        statusFilter,
      );
    },
    [search, sortField, sortOrder, statusFilter, updateSearchParams],
  );

  const onSortModelChange = useCallback(
    (model: GridSortModel) => {
      updateSearchParams(
        page,
        model[0].field,
        model[0].sort ?? 'asc',
        search,
        statusFilter,
      );
    },
    [page, search, statusFilter, updateSearchParams],
  );

  const onStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const newStatus = event.target.value as any;
      setStatusFilter(newStatus);
      updateSearchParams(1, sortField, sortOrder, search, newStatus);
    },
    [search, sortField, sortOrder, updateSearchParams],
  );

  useEffect(() => {
    if (search === deferredSearch) {
      return;
    }
    updateSearchParams(1, sortField, sortOrder, deferredSearch, statusFilter);
  }, [
    deferredSearch,
    page,
    search,
    sortField,
    sortOrder,
    statusFilter,
    updateSearchParams,
  ]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Users
      </Typography>
      <TextField
        id="note"
        inputProps={{
          readOnly: true,
        }}
        label="Note"
        multiline
        rows={1}
        maxRows={3}
        value={
          'The number of WebCards in this table may be affected by the current search. Open the account details to view the total number of WebCards.'
        }
      />
      <Box display="flex" gap={2} alignItems="center">
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
        <FormControl sx={{ width: 130 }}>
          <InputLabel id="status">Status</InputLabel>
          <Select
            labelId="status"
            id="status"
            value={statusFilter}
            label="Status"
            onChange={onStatusChange}
          >
            <MenuItem value={'All'}>All</MenuItem>
            <MenuItem value={'Active'}>Active</MenuItem>
            <MenuItem value={'Suspended'}>Suspended</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DataGrid
        columns={columns}
        rows={users}
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
          router.push(`/users/${params.id}`);
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
    field: 'email',
    headerName: 'Email',
    flex: 1,
    valueFormatter: params => params.value || '-',
  },
  {
    field: 'phoneNumber',
    headerName: 'Phone number',
    flex: 1,
    valueFormatter: params => params.value || '-',
  },
  {
    field: 'status',
    headerName: 'Account Status',
    flex: 1,
    renderCell: params => (
      <Chip
        color={params.value ? 'warning' : 'default'}
        label={params.value ? 'Suspended' : 'Active'}
      />
    ),
  },
  { field: 'webCardsCount', headerName: 'WebCards', width: 150 },
  {
    field: 'createdAt',
    headerName: 'Inscription date',
    type: 'date',
    width: 150,
  },
];

export default UsersList;
