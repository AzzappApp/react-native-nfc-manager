'use client';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import DataGrid from '#components/DataGrid';
import type { CardStyle } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type CardStylesListProps = {
  cardStyles: CardStyle[];
  pageSize: number;
};

const CardStylesList = ({ cardStyles, pageSize }: CardStylesListProps) => {
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
        WebCards Styles
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
            router.push('/cardStyles/add');
          }}
        >
          NEW STYLE
        </Button>
      </Box>
      <DataGrid
        columns={columns}
        rows={cardStyles}
        pageSizeOptions={[pageSize]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
        onRowClick={params => {
          router.push(`/cardStyles/${params.id}`);
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
    field: 'fontFamily',
    headerName: 'Font Falimy',
    flex: 1,
  },
  {
    field: 'titleFontFamily',
    headerName: 'Title Font Family',
    flex: 1,
  },
  {
    field: 'buttonColor',
    headerName: 'Button Color',
    flex: 1,
  },
  {
    field: 'enabled',
    headerName: 'Inscription date',
    type: 'boolean',
    width: 100,
  },
];

export default CardStylesList;
