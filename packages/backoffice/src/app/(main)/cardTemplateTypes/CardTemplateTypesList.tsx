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
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from 'react';
import DataGrid from '#components/DataGrid';
import type { CardTemplateTypeItem, Filters, SortColumn, Status } from './page';
import type { SelectChangeEvent } from '@mui/material';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';

type CardTemplateTypesListProps = {
  cardTemplateTypes: CardTemplateTypeItem[];
  count: number;
  page: number;
  pageSize: number;
  sortField: SortColumn;
  sortOrder: 'asc' | 'desc';
  search: string | null;
  filters: Filters;
};

const CardTemplateTypesList = ({
  cardTemplateTypes,
  count,
  page,
  pageSize,
  sortField,
  sortOrder,
  search,
  filters,
}: CardTemplateTypesListProps) => {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const [currentSearch, setCurrentSearch] = useState(search ?? '');
  const defferedSearch = useDeferredValue(currentSearch);
  const [statusFilter, setStatusFilter] = useState(filters?.status || 'All');

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
          `/cardTemplateTypes?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}&status=${filters.status ?? ''}`,
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
    [statusFilter, search, sortField, sortOrder, updateSearchParams],
  );

  const onSortModelChange = useCallback(
    (model: GridSortModel) => {
      updateSearchParams(
        page,
        model[0]?.field ?? 'label',
        model[0]?.sort ?? 'asc',
        search,
        {
          status: statusFilter,
        },
      );
    },
    [statusFilter, page, search, updateSearchParams],
  );

  useEffect(() => {
    if (search === defferedSearch) {
      return;
    }
    updateSearchParams(1, sortField, sortOrder, defferedSearch, {
      status: statusFilter,
    });
  }, [
    statusFilter,
    defferedSearch,
    page,
    search,
    sortField,
    sortOrder,
    updateSearchParams,
  ]);

  const onStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const newStatus = event.target.value as Status;
      setStatusFilter(newStatus);
      updateSearchParams(1, sortField, sortOrder, search, {
        status: newStatus,
      });
    },
    [search, sortField, sortOrder, updateSearchParams],
  );

  return (
    <>
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
              label="Business status"
              onChange={onStatusChange}
            >
              <MenuItem value={'All'}>All</MenuItem>
              <MenuItem value={'Enabled'}>Enabled</MenuItem>
              <MenuItem value={'Disabled'}>Disabled</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" alignItems="center">
          <Button
            variant="contained"
            onClick={() => {
              router.push('/cardTemplateTypes/add');
            }}
          >
            NEW TYPE
          </Button>
        </Box>
      </Box>

      <DataGrid
        columns={columns}
        rows={cardTemplateTypes}
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
          router.push(`/cardTemplateTypes/${params.id}`);
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
    field: 'label',
    headerName: 'Label',
    flex: 2,
  },
  {
    field: 'category',
    headerName: 'Category',
    flex: 2,
  },
  {
    field: 'templates',
    headerName: 'Templates',
    flex: 1,
  },
  {
    field: 'status',
    headerName: 'Status',
    renderCell: params => (
      <Chip
        color={params.value ? 'warning' : 'default'}
        label={params.value ? 'Enabled' : 'Disabled'}
      />
    ),
    flex: 1,
  },
];

export default CardTemplateTypesList;
