'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import DataGrid from '#components/DataGrid';
import type { CardTemplateType } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type CardTemplateTypesListProps = {
  cardTemplateTypes: CardTemplateType[];
  pageSize: number;
};

const CardTemplateTypesList = ({
  cardTemplateTypes,
  pageSize,
}: CardTemplateTypesListProps) => {
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
        WebCards templates types
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
            router.push('/cardTemplateTypes/add');
          }}
        >
          NEW TYPE
        </Button>
      </Box>
      <DataGrid
        columns={columns}
        rows={cardTemplateTypes}
        pageSizeOptions={[pageSize]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
        onRowClick={params => {
          router.push(`/cardTemplateTypes/${params.id}`);
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
    field: 'webCardCategoryId',
    headerName: 'Profile Category',
    renderCell: params => params.row.cardTemplateTypeId,
    width: 250,
  },
];

export default CardTemplateTypesList;
