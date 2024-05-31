'use client';

import { Search } from '@mui/icons-material';
import {
  Box,
  Button,
  InputAdornment,
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
import type { SortColumn } from './page';
import type { CompanyActivityType } from '@azzapp/data';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';

type CompanyActivitiesListProps = {
  companyActivitiesTypes: CompanyActivityType[];
  count: number;
  page: number;
  pageSize: number;
  sortField: SortColumn;
  sortOrder: 'asc' | 'desc';
  search: string | null;
};

const CompanyActivitiesTypesList = ({
  companyActivitiesTypes,
  count,
  page,
  pageSize,
  sortField,
  sortOrder,
  search,
}: CompanyActivitiesListProps) => {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const updateSearchParams = useCallback(
    (page: number, sort: string, order: string, search: string | null) => {
      startTransition(() => {
        router.replace(
          `/companyActivitiesTypes?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}`,
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
        Activities Types
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
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
        <Box display="flex" alignItems="center">
          <Button
            variant="contained"
            onClick={() => {
              router.push('/companyActivitiesTypes/add');
            }}
          >
            NEW ACTIVITY TYPE
          </Button>
        </Box>
      </Box>
      <DataGrid
        columns={columns}
        rows={companyActivitiesTypes}
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
          router.push(`/companyActivitiesTypes/${params.id}`);
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
];

export default CompanyActivitiesTypesList;
