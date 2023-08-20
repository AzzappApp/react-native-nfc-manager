'use client';
import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import DataGrid from '#components/DataGrid';
import type { ProfileCategory } from '@azzapp/data/domains';
import type { GridColDef } from '@mui/x-data-grid';

type ProfileCategoriesListProps = {
  profileCategories: ProfileCategory[];
};

const ProfileCategoriesList = ({
  profileCategories,
}: ProfileCategoriesListProps) => {
  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        ProfileCategories
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2,
        }}
      >
        <Link href="/profileCategories/add">
          <Typography variant="body1">+ New ProfileCategory</Typography>
        </Link>
      </Box>
      <DataGrid
        columns={columns}
        rows={profileCategories}
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
      <Link href={`/profileCategories/${params.id}`}>${params.row.id}</Link>
    ),
  },
  {
    field: 'labels.en',
    headerName: 'Label',
    flex: 1,
    renderCell: params => params.row.labels?.en,
  },
  {
    field: 'profileKind',
    headerName: 'Profile Kind',
    flex: 1,
  },
  {
    field: 'order',
    headerName: 'Order',
    width: 100,
  },
  {
    field: 'enabled',
    headerName: 'Enabled',
    type: 'boolean',
    width: 100,
  },
];

export default ProfileCategoriesList;
