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
import type { CoverTemplateItem, Filters, SortColumn, Status } from './page';
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
  filters: Filters;
};

const CoverTemplatesList = ({
  coverTemplates,
  count,
  page,
  pageSize,
  sortField,
  sortOrder,
  search,
  filters,
}: CoverTemplatesListProps) => {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const [currentSearch, setCurrentSearch] = useState(search ?? '');
  const defferedSearch = useDeferredValue(currentSearch);
  const [personalStatusFilter, setPersonalStatusFilter] = useState(
    filters?.personalStatus || 'All',
  );
  const [businessStatusFilter, setBusinessStatusFilter] = useState(
    filters?.businessStatus || 'All',
  );

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
          `/coverTemplates?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}&ps=${filters.personalStatus ?? ''}&bs=${filters.businessStatus ?? ''}`,
        );
      });
    },
    [router, startTransition],
  );

  const onPageChange = useCallback(
    (model: GridPaginationModel) => {
      updateSearchParams(model.page + 1, sortField, sortOrder, search, {
        businessStatus: businessStatusFilter,
        personalStatus: personalStatusFilter,
      });
    },
    [
      businessStatusFilter,
      personalStatusFilter,
      search,
      sortField,
      sortOrder,
      updateSearchParams,
    ],
  );

  const onSortModelChange = useCallback(
    (model: GridSortModel) => {
      updateSearchParams(
        page,
        model[0]?.field ?? 'labelKey',
        model[0]?.sort ?? 'asc',
        search,
        {
          businessStatus: businessStatusFilter,
          personalStatus: personalStatusFilter,
        },
      );
    },
    [
      businessStatusFilter,
      page,
      personalStatusFilter,
      search,
      updateSearchParams,
    ],
  );

  useEffect(() => {
    if (search === defferedSearch) {
      return;
    }
    updateSearchParams(1, sortField, sortOrder, defferedSearch, {
      businessStatus: businessStatusFilter,
      personalStatus: personalStatusFilter,
    });
  }, [
    businessStatusFilter,
    defferedSearch,
    page,
    personalStatusFilter,
    search,
    sortField,
    sortOrder,
    updateSearchParams,
  ]);

  const onPersonalStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const newStatus = event.target.value as Status;
      setPersonalStatusFilter(newStatus);
      updateSearchParams(1, sortField, sortOrder, search, {
        businessStatus: businessStatusFilter,
        personalStatus: newStatus,
      });
    },
    [businessStatusFilter, search, sortField, sortOrder, updateSearchParams],
  );

  const onBusinessStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const newStatus = event.target.value as Status;
      setBusinessStatusFilter(newStatus);
      updateSearchParams(1, sortField, sortOrder, search, {
        businessStatus: newStatus,
        personalStatus: personalStatusFilter,
      });
    },
    [personalStatusFilter, search, sortField, sortOrder, updateSearchParams],
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
            <InputLabel id="businessStatus">Business status</InputLabel>
            <Select
              labelId="businessStatus"
              id="businessStatus"
              value={businessStatusFilter}
              label="Business status"
              onChange={onBusinessStatusChange}
            >
              <MenuItem value={'All'}>All</MenuItem>
              <MenuItem value={'Enabled'}>Enabled</MenuItem>
              <MenuItem value={'Disabled'}>Disabled</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ width: 130 }}>
            <InputLabel id="personalStatus">Personal status</InputLabel>
            <Select
              labelId="personalStatus"
              id="personalStatus"
              value={personalStatusFilter}
              label="Personal status"
              onChange={onPersonalStatusChange}
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
    field: 'kind',
    headerName: 'Profile Kind',
    flex: 1,
  },
  {
    field: 'businessEnabled',
    headerName: 'Business',
    type: 'boolean',
    width: 100,
    renderCell: params => (
      <Chip
        color={params.value ? 'warning' : 'default'}
        label={params.value ? 'Enabled' : 'Disabled'}
      />
    ),
  },
  {
    field: 'personalEnabled',
    headerName: 'Personal',
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
