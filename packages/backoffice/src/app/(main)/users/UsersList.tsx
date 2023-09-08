'use client';
import { Box, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from 'react';
import DataGrid from '#components/DataGrid';
import type { User } from '@azzapp/data/domains';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';

type UsersListProps = {
  users: User[];
  count: number;
  page: number;
  pageSize: number;
  sortField: 'createdAt' | 'email' | 'phoneNumber' | 'roles';
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
    updateSearchParams(model.page, sortField, sortOrder, search);
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
    <>
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
        paginationMode="server"
        sortingMode="server"
        onPaginationModelChange={onPageChange}
        onSortModelChange={onSortModelChange}
        loading={loading}
        pageSizeOptions={[pageSize]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
      />
    </>
  );
};

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 250,
    renderCell: params => (
      <Link href={`/users/${params.id}`}>${params.row.id}</Link>
    ),
  },
  { field: 'email', headerName: 'Email', flex: 1 },
  {
    field: 'phoneNumber',
    headerName: 'Phone number',
    flex: 1,
    renderCell: params => (
      <Box sx={{ width: 50, height: 50, backgroundColor: params.row.value }} />
    ),
  },
  { field: 'roles', headerName: 'Roles', width: 150 },
  {
    field: 'createdAt',
    headerName: 'Inscription date',
    type: 'date',
    width: 150,
  },
];

export default UsersList;
