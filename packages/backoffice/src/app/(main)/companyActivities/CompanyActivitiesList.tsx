'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import DataGrid from '#components/DataGrid';
import type { CompanyActivity } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type CompanyActivitiesListProps = {
  companyActivities: CompanyActivity[];
  pageSize: number;
};

const CompanyActivitiesList = (props: CompanyActivitiesListProps) => {
  const { companyActivities, pageSize } = props;
  const router = useRouter();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Activities
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={() => {
            router.push('/companyActivities/add');
          }}
        >
          NEW ACTIVITY
        </Button>
      </Box>
      <DataGrid
        columns={columns}
        rows={companyActivities}
        pageSizeOptions={[pageSize]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
        onRowClick={params => {
          router.push(`/companyActivities/${params.id}`);
        }}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          },
        }}
      />
    </Box>
  );
};

const columns: GridColDef[] = [
  {
    field: 'labelKey',
    headerName: 'Label Key',
    flex: 1,
  },
  {
    field: 'cardtemplateTypeId',
    headerName: 'Card Template Type ',
    renderCell: params => params.row.cardTemplateTypeId,
    width: 250,
  },
];

export default CompanyActivitiesList;
