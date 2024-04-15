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
import type { ColorStatus, Filters, SortColumn } from './page';
import type { ColorPalette } from '@azzapp/data';
import type { SelectChangeEvent } from '@mui/material';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';

type ColorPalettesListProps = {
  colorPalettes: ColorPalette[];
  count: number;
  page: number;
  pageSize: number;
  sortField: SortColumn;
  sortOrder: 'asc' | 'desc';
  search: string | null;
  filters: Filters;
};

const ColorPalettesList = ({
  colorPalettes,
  count,
  page,
  pageSize,
  sortField,
  sortOrder,
  search,
  filters,
}: ColorPalettesListProps) => {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const [currentSearch, setCurrentSearch] = useState(search ?? '');
  const defferedSearch = useDeferredValue(currentSearch);
  const [statusFilter, setStatusFilter] = useState(filters.status);

  const updateSearchParams = useCallback(
    (
      page: number,
      sort: string,
      order: string,
      search: string | null,
      filters: Filters,
    ) => {
      startTransition(() => {
        router.replace(
          `/colorPalettes?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}&status=${filters?.status ?? ''}`,
        );
      });
    },
    [router, startTransition],
  );

  const onPageChange = useCallback(
    (model: GridPaginationModel) => {
      updateSearchParams(model.page + 1, sortField, sortOrder, search, {
        status: statusFilter,
      });
    },
    [search, sortField, sortOrder, statusFilter, updateSearchParams],
  );

  const onSortModelChange = useCallback(
    (model: GridSortModel) => {
      updateSearchParams(
        page,
        model[0]?.field ?? 'id',
        model[0]?.sort ?? 'asc',
        search,
        {
          status: statusFilter,
        },
      );
    },
    [page, search, statusFilter, updateSearchParams],
  );

  const onStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const newStatus = event.target.value as ColorStatus;
      setStatusFilter(newStatus);
      updateSearchParams(1, sortField, sortOrder, search, {
        status: newStatus,
      });
    },
    [search, sortField, sortOrder, updateSearchParams],
  );

  useEffect(() => {
    if (search === defferedSearch) {
      return;
    }
    updateSearchParams(1, sortField, sortOrder, defferedSearch, {
      status: statusFilter,
    });
  }, [
    defferedSearch,
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
        Colors
      </Typography>
      <Box display="flex" justifyContent="space-between" gap={2} mb={2} mt={2}>
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
              <MenuItem value={'all'}>All</MenuItem>
              <MenuItem value={'Enabled'}>Enabled</MenuItem>
              <MenuItem value={'Disabled'}>Disabled</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" alignItems="center" gap={2} mb={2} mt={2}>
          <Button
            variant="contained"
            onClick={() => {
              router.push('/colorPalettes/add');
            }}
          >
            NEW COLOR
          </Button>
        </Box>
      </Box>
      <DataGrid
        columns={columns}
        rows={colorPalettes}
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
          router.push(`/colorPalettes/${params.id}`);
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

// eslint-disable-next-line react/display-name
const renderColor = (field: string) => (params: any) => (
  <Box
    sx={{
      width: 100,
      height: 30,
      backgroundColor: params.row[field],
      border: `1px solid #000`,
    }}
  />
);

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 250,
  },

  {
    field: 'primary',
    headerName: 'Primary Color',
    flex: 1,
    renderCell: renderColor('primary'),
  },
  {
    field: 'dark',
    headerName: 'Dark Color',
    flex: 1,
    renderCell: renderColor('dark'),
  },
  {
    field: 'light',
    headerName: 'Light Color',
    flex: 1,
    renderCell: renderColor('light'),
  },
  {
    field: 'enabled',
    headerName: 'Status',
    type: 'boolean',
    width: 100,
    renderCell: params => (
      <Chip
        color={params.value ? 'warning' : 'default'}
        label={params.value ? 'Enabled' : 'Disabled'}
      />
    ),
  },
];

export default ColorPalettesList;
