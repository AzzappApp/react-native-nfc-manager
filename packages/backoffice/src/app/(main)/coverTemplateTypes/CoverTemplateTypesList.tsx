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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from 'react';
import type { CoverTemplateType } from '@azzapp/data';
import type { SelectChangeEvent } from '@mui/material';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';

type Props = {
  search: string | null;
  count: number;
  coverTemplateTypes: Array<CoverTemplateType & { templates: number }>;
  page: number;
  pageSize: number;
  sortField: 'label' | 'status' | 'templates';
  sortOrder: 'asc' | 'desc';
};

const CoverTemplateTypesList = ({
  search,
  count,
  coverTemplateTypes,
  page,
  pageSize,
  sortField,
  sortOrder,
}: Props) => {
  const router = useRouter();

  const [currentSearch, setCurrentSearch] = useState(search ?? '');
  const defferedSearch = useDeferredValue(currentSearch);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, startTransition] = useTransition();

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
          `/coverTemplateTypes?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}&status=${status ?? ''}`,
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
        model[0]?.field ?? 'order',
        model[0]?.sort ?? 'asc',
        search,
        statusFilter,
      );
    },
    [page, search, statusFilter, updateSearchParams],
  );

  useEffect(() => {
    if (search === defferedSearch) {
      return;
    }
    updateSearchParams(1, sortField, sortOrder, defferedSearch, statusFilter);
  }, [
    defferedSearch,
    page,
    search,
    sortField,
    sortOrder,
    statusFilter,
    updateSearchParams,
  ]);

  const onStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const newStatus = event.target.value as string;
      setStatusFilter(newStatus);
      updateSearchParams(
        1,
        sortField,
        sortOrder,
        search,
        newStatus === 'all' ? '' : newStatus,
      );
    },
    [search, sortField, sortOrder, updateSearchParams],
  );

  return (
    <>
      <TextField
        margin="normal"
        name="search"
        label="Search"
        type="text"
        onChange={e => setCurrentSearch(e.target.value)}
        value={currentSearch}
        sx={{ mb: 2 }}
      />

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
              router.push('/coverTemplateTypes/add');
            }}
          >
            NEW TYPE
          </Button>
        </Box>
      </Box>
      <DataGrid
        columns={columns}
        rows={coverTemplateTypes}
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
          router.push(`/coverTemplateTypes/${params.id}`);
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
    </>
  );
};

const columns: GridColDef[] = [
  {
    field: 'labelKey',
    headerName: 'Label',
    flex: 1,
  },
  {
    field: 'templates',
    headerName: 'Templates',
    flex: 1,
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

export default CoverTemplateTypesList;
