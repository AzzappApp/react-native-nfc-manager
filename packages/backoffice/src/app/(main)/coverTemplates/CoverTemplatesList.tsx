'use client';

import { Search } from '@mui/icons-material';
import {
  Box,
  Button,
  // Button,
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
import type { CoverTemplateItem, SortColumn, StatusFilter } from './page';
import type { SelectChangeEvent } from '@mui/material';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';

type CoverTemplatesListProps = {
  coverTemplates: CoverTemplateItem[];
  count: number;
  page: number;
  pageSize: number;
  sortField: SortColumn;
  sortOrder: 'asc' | 'desc';
  search: string | null;
  statusFilter: StatusFilter;
};

const CoverTemplatesList = ({
  coverTemplates,
  count,
  page,
  pageSize,
  sortField,
  sortOrder,
  search,
  statusFilter: statusFilterProp,
}: CoverTemplatesListProps) => {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const [currentSearch, setCurrentSearch] = useState(search ?? '');
  const deferredSearch = useDeferredValue(currentSearch);
  const [statusFilter, setPersonalStatusFilter] = useState<StatusFilter>(
    statusFilterProp || 'All',
  );

  const updateSearchParams = useCallback(
    (
      page: number,
      sort: string,
      order: string,
      search: string | null,
      statusFilter: StatusFilter,
    ) => {
      startTransition(() => {
        router.replace(
          `/coverTemplates?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}&st=${statusFilter ?? ''}`,
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
    [statusFilter, search, sortField, sortOrder, updateSearchParams],
  );

  const onSortModelChange = useCallback(
    (model: GridSortModel) => {
      updateSearchParams(
        page,
        model[0]?.field ?? 'label',
        model[0]?.sort ?? 'asc',
        search,
        statusFilter,
      );
    },
    [page, statusFilter, search, updateSearchParams],
  );

  useEffect(() => {
    if (search === deferredSearch) {
      return;
    }
    updateSearchParams(1, sortField, sortOrder, deferredSearch, statusFilter);
  }, [
    deferredSearch,
    page,
    statusFilter,
    search,
    sortField,
    sortOrder,
    updateSearchParams,
  ]);

  const onStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const newStatus = event.target.value as StatusFilter;
      setPersonalStatusFilter(newStatus);
      updateSearchParams(1, sortField, sortOrder, search, newStatus);
    },
    [search, sortField, sortOrder, updateSearchParams],
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
        Covers templates
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
              label="Personal status"
              onChange={onStatusChange}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Enabled">Enabled</MenuItem>
              <MenuItem value="Disabled">Disabled</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" alignItems="center">
          <Button
            variant="contained"
            onClick={() => {
              router.push('/coverTemplates/add');
            }}
          >
            NEW TEMPLATE
          </Button>
        </Box>
      </Box>

      <DataGrid
        columns={columns}
        rows={coverTemplates}
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
          router.push(`/coverTemplates/${params.id}`);
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
    field: 'name',
    headerName: 'Name',
    flex: 1,
  },
  {
    field: 'type',
    headerName: 'Type',
    flex: 1,
  },
  {
    field: 'mediaCount',
    headerName: 'Media',
    width: 150,
  },
  {
    field: 'status',
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

export default CoverTemplatesList;
