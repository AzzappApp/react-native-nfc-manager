'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import DataGrid from '#components/DataGrid';
import type { CoverTemplate } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type CoverTemplatesListProps = {
  coverTemplates: CoverTemplate[];
  pageSize: number;
};

const CoverTemplatesList = ({
  coverTemplates,
  pageSize,
}: CoverTemplatesListProps) => {
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
        Covers templates
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
            router.push('/coverTemplates/add');
          }}
        >
          NEW TEMPLATE
        </Button>
      </Box>
      <DataGrid
        columns={columns}
        rows={coverTemplates}
        pageSizeOptions={[pageSize]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
        onRowClick={params => {
          router.push(`/coverTemplates/${params.id}`);
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
  },
  {
    field: 'personalEnabled',
    headerName: 'Personal',
    type: 'boolean',
    width: 100,
  },
];

export default CoverTemplatesList;
