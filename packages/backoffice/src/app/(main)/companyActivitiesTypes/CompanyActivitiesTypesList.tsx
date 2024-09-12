'use client';

import { Search } from '@mui/icons-material';
import { Box, Button, InputAdornment, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';
import DataGrid from '#components/DataGrid';
import type { CompanyActivityTypeItem } from './page';
import type { GridColDef } from '@mui/x-data-grid';

type CompanyActivitiesListProps = {
  companyActivitiesTypes: CompanyActivityTypeItem[];
};

const CompanyActivitiesTypesList = ({
  companyActivitiesTypes,
}: CompanyActivitiesListProps) => {
  const router = useRouter();

  const [currentSearch, setCurrentSearch] = useState('');
  const deferredSearch = useDeferredValue(currentSearch);

  const items = useMemo(
    () =>
      companyActivitiesTypes.filter(
        item =>
          !deferredSearch ||
          item.label?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
          item.id.toLowerCase().includes(deferredSearch.toLowerCase()),
      ),
    [companyActivitiesTypes, deferredSearch],
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
        rows={items}
        onRowClick={params => {
          router.push(`/companyActivitiesTypes/${params.id}`);
        }}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          },
        }}
        pageSizeOptions={[25]}
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
    flex: 1,
  },
];

export default CompanyActivitiesTypesList;
