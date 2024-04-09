'use client';
import { Search } from '@mui/icons-material';
import {
  Box,
  Button,
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
import type { Filters } from './page';
import type { WebCardCategory } from '@azzapp/data';
import type { SelectChangeEvent } from '@mui/material';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';

type WebCardCategoriesListProps = {
  webCardCategories: WebCardCategory[];
  count: number;
  page: number;
  pageSize: number;
  sortField: 'createdAt' | 'email' | 'phoneNumber' | 'roles';
  sortOrder: 'asc' | 'desc';
  search: string | null;
  filters: Filters;
};

const WebCardCategoriesList = ({
  webCardCategories,
  count,
  page,
  pageSize,
  sortField,
  sortOrder,
  search,
  filters,
}: WebCardCategoriesListProps) => {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const updateSearchParams = useCallback(
    (
      page: number,
      sort: string,
      order: string,
      search: string | null,
      status?: string | null,
    ) => {
      startTransition(() => {
        router.replace(
          `/webCardCategories?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}&status=${status ?? ''}`,
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
      updateSearchParams(page, 'order', 'asc', search);
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

  const [statusFilter, setStatusFilter] = useState(filters?.enabled || 'all');

  const onStatusChange = (event: SelectChangeEvent) => {
    const newStatus = event.target.value as string;
    setStatusFilter(newStatus);
    updateSearchParams(
      1,
      sortField,
      sortOrder,
      search,
      newStatus === 'all' ? '' : newStatus,
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Categories
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
              <MenuItem value={'all'}>All</MenuItem>
              <MenuItem value={'true'}>Enabled</MenuItem>
              <MenuItem value={'false'}>Disabled</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" alignItems="center">
          <Button
            variant="contained"
            onClick={() => {
              router.push('/webCardCategories/add');
            }}
          >
            NEW CATEGORY
          </Button>
        </Box>
      </Box>
      <DataGrid
        columns={columns}
        rows={webCardCategories}
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
          router.push(`/webCardCategories/${params.id}`);
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
    field: 'labelKey',
    headerName: 'Label',
    flex: 1,
  },
  {
    field: 'webCardKind',
    headerName: 'Profile kind',
    flex: 1,
  },
  {
    field: 'order',
    headerName: 'Order',
  },
  {
    field: 'enabled',
    headerName: 'Status',
    renderCell: params => (
      <Chip
        color={params.value ? 'warning' : 'default'}
        label={params.value ? 'Enabled' : 'Disabled'}
      />
    ),
  },
];

export default WebCardCategoriesList;
