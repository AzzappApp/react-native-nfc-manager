'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import DataGrid from '#components/DataGrid';
import type { CardTemplate } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type CardTemplatesListProps = {
  cardTemplates: CardTemplate[];
  pageSize: number;
};

const CardTemplatesList = (props: CardTemplatesListProps) => {
  const { cardTemplates, pageSize } = props;
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
        WebCards templates
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
            router.push('/cardTemplates/add');
          }}
        >
          NEW TEMPLATE
        </Button>
      </Box>
      <DataGrid
        columns={columns}
        rows={cardTemplates}
        pageSizeOptions={[pageSize]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
        onRowClick={params => {
          router.push(`/cardTemplates/${params.id}`);
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
    field: 'modules',
    headerName: 'modules',
    renderCell: params => params.row.modules.length,
  },
];

export default CardTemplatesList;
