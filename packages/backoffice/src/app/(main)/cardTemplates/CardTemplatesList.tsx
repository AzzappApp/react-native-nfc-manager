'use client';

import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import DataGrid from '#components/DataGrid';
import type { CardTemplate } from '@azzapp/data/domains';
import type { GridColDef } from '@mui/x-data-grid';

type CardTemplatesListProps = {
  cardTemplates: CardTemplate[];
};

const CardTemplatesList = (props: CardTemplatesListProps) => {
  const { cardTemplates } = props;

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        CardTemplates
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2,
        }}
      >
        <Link href="/cardTemplates/add">
          <Typography variant="body1">+ New CardTemplate</Typography>
        </Link>
      </Box>
      <DataGrid
        columns={columns}
        rows={cardTemplates}
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
      <Link href={`/cardTemplates/${params.id}`}>${params.row.id}</Link>
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
    field: 'modules',
    headerName: 'modules',
    renderCell: params => params.row.modules.length,
  },
];

export default CardTemplatesList;
