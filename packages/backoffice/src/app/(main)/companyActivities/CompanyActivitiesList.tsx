'use client';

import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import DataGrid from '#components/DataGrid';
import type { CompanyActivity } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type CompanyActivitiesListProps = {
  companyActivities: CompanyActivity[];
};

const CompanyActivitiesList = (props: CompanyActivitiesListProps) => {
  const { companyActivities } = props;

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Company Activities
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2,
        }}
      >
        <Link href="/companyActivities/add">
          <Typography variant="body1">+ New Company Activity</Typography>
        </Link>
      </Box>
      <DataGrid
        columns={columns}
        rows={companyActivities}
        pageSizeOptions={[25]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
      />
    </>
  );
};

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 250,
    renderCell: params => (
      // Bypass cache to avoid getting out-of-date data
      <a href={`/companyActivities/${params.id}`}>${params.row.id}</a>
    ),
  },
  {
    field: 'labels',
    valueGetter: params => {
      return params.row.labels.en;
    },
    headerName: 'Name',
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
