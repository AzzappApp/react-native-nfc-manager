'use client';
import { Search } from '@mui/icons-material';
import { Box, InputAdornment, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from 'react';
import DataGrid from '#components/DataGrid';
import type { UserTable } from './page';
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
  sortField: 'createdAt' | 'email' | 'phoneNumber' | 'webcardsCount';
  sortOrder: 'asc' | 'desc';
  search: string | null;
};

const UsersList = ({
  users,
  count,
  page,
  pageSize,
  sortField,
  sortOrder,
  search,
}: UsersListProps) => {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const updateSearchParams = useCallback(
    (page: number, sort: string, order: string, search: string | null) => {
      startTransition(() => {
        router.replace(
          `/users?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}`,
        );
      });
    },
    [router, startTransition],
  );

  const onPageChange = (model: GridPaginationModel) => {
    updateSearchParams(model.page + 1, sortField, sortOrder, search);
  };

  const onSortModelChange = (model: GridSortModel) => {
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
        Users
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
  { field: 'webcardsCount', headerName: 'WebCards', width: 150 },
  {
    field: 'createdAt',
    headerName: 'Inscription date',
    type: 'date',
    width: 150,
  },
];

export default UsersList;
