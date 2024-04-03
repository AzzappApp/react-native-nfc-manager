'use client';
import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import DataGrid from '#components/DataGrid';
import type { CardStyle } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type CardStylesListProps = {
  cardStyles: CardStyle[];
};

const CardStylesList = ({ cardStyles }: CardStylesListProps) => {
  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        CardStyles
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2,
        }}
      >
        <Link href="/cardStyles/add">
          <Typography variant="body1">+ New CardStyle</Typography>
        </Link>
      </Box>
      <DataGrid
        columns={columns}
        rows={cardStyles}
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
      <Link href={`/cardStyles/${params.id}`}>${params.row.id}</Link>
    ),
  },
  {
    field: 'labels',
    headerName: 'Label',
    flex: 1,
    renderCell: params => params.row.labels?.en,
    sortComparator: (a, b) => {
      return a.en.localeCompare(b.en);
    },
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
