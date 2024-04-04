'use client';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import DataGrid from '#components/DataGrid';
import type { WebCardCategory } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type WebCardCategoriesListProps = {
  webCardCategories: WebCardCategory[];
  pageSize: number;
};

const WebCardCategoriesList = ({
  webCardCategories,
  pageSize,
}: WebCardCategoriesListProps) => {
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
        Categories
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
            router.push('/webCardCategories/add');
          }}
        >
          NEW CATEGORY
        </Button>
      </Box>
      <DataGrid
        columns={columns}
        rows={webCardCategories}
        pageSizeOptions={[pageSize]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
        onRowClick={params => {
          router.push(`/webCardCategories/${params.id}`);
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
