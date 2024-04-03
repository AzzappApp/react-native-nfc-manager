'use client';
import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import DataGrid from '#components/DataGrid';
import type { WebCardCategory } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type WebCardCategoriesListProps = {
  webCardCategories: WebCardCategory[];
};

const WebCardCategoriesList = ({
  webCardCategories,
}: WebCardCategoriesListProps) => {
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
        <Link href="/webCardCategories/add">
          <Typography variant="body1">+ New WebCardCategory</Typography>
        </Link>
      </Box>
      <DataGrid
        columns={columns}
        rows={webCardCategories}
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
      <Link href={`/webCardCategories/${params.id}`}>${params.row.id}</Link>
    ),
  },
  {
    field: 'labels.en',
    headerName: 'Label',
    flex: 1,
    renderCell: params => params.row.labels?.en,
  },
  {
    field: 'webCardKind',
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

export default WebCardCategoriesList;
