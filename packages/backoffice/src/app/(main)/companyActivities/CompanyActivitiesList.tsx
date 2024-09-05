'use client';

import { Search } from '@mui/icons-material';
import { Box, Button, InputAdornment, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';
import DataGrid from '#components/DataGrid';
import type { CompanyActivity, LocalizationMessage } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type CompanyActivitiesListProps = {
  companyActivities: CompanyActivity[];
  labels: LocalizationMessage[];
};

const CompanyActivitiesList = ({
  companyActivities,
  labels,
}: CompanyActivitiesListProps) => {
  const router = useRouter();

  const [currentSearch, setCurrentSearch] = useState('');
  const deferredSearch = useDeferredValue(currentSearch);

  const items = useMemo(() => {
    const labelsMap = new Map(labels.map(label => [label.key, label.value]));
    return companyActivities
      .map(activity => ({
        id: activity.id,
        label: labelsMap.get(activity.id) || activity.id,
        companyActivityTypeLabel: activity.companyActivityTypeId
          ? labelsMap.get(activity.companyActivityTypeId)
          : null,
        cardTemplateTypeLabel: activity.cardTemplateTypeId
          ? labelsMap.get(activity.cardTemplateTypeId)
          : null,
      }))
      .filter(
        item =>
          !deferredSearch ||
          item.label.toLowerCase().includes(deferredSearch.toLowerCase()) ||
          (item.companyActivityTypeLabel &&
            item.companyActivityTypeLabel
              .toLowerCase()
              .includes(deferredSearch.toLowerCase())) ||
          (item.cardTemplateTypeLabel &&
            item.cardTemplateTypeLabel
              .toLowerCase()
              .includes(deferredSearch.toLowerCase())),
      );
  }, [companyActivities, deferredSearch, labels]);

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
        rows={items}
        onRowClick={params => {
          router.push(`/companyActivities/${params.id}`);
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
  {
    field: 'companyActivityTypeLabel',
    headerName: 'Activity Type',
    flex: 1,
  },
  {
    field: 'cardTemplateTypeLabel',
    headerName: 'Webcard Template Type',
    flex: 1,
  },
];

export default CompanyActivitiesList;
