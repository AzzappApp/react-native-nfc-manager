'use client';

import { Search } from '@mui/icons-material';
import { Box, Button, InputAdornment, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from 'react';
import DataGrid from '#components/DataGrid';
import type { CompanyActivityItem, SortColumn } from './page';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';

type CompanyActivitiesListProps = {
  companyActivities: CompanyActivityItem[];
  count: number;
  page: number;
  pageSize: number;
  sortField: SortColumn;
  sortOrder: 'asc' | 'desc';
  search: string | null;
};

const CompanyActivitiesList = ({
  companyActivities,
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
          `/companyActivities?page=${page}&sort=${sort}&order=${order}&s=${search ?? ''}`,
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
    <>
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
              router.push('/companyActivities/add');
            }}
          >
            NEW ACTIVITY
          </Button>
        </Box>
      </Box>
      <DataGrid
        columns={columns}
        rows={companyActivities}
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
          router.push(`/companyActivities/${params.id}`);
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
    field: 'companyActivityTypeLabelKey',
    headerName: 'Activity Type',
    flex: 1,
  },
  {
    field: 'webCardCategoryLabelKey',
    headerName: 'Category',
    flex: 1,
  },
  {
    field: 'cardTemplateTypeLabelKey',
    headerName: 'Webcard Template Type',
    flex: 1,
  },
];

export default CompanyActivitiesList;
