'use client';

import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import DataGrid from '#components/DataGrid';
import type { CoverTemplate } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type CoverTemplatesListProps = {
  coverTemplates: CoverTemplate[];
};

const CoverTemplatesList = ({ coverTemplates }: CoverTemplatesListProps) => {
  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        CoverTemplates
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2,
        }}
      >
        <Link href="/coverTemplates/add">
          <Typography variant="body1">+ New CoverTemplate</Typography>
        </Link>
      </Box>
      <DataGrid
        columns={columns}
        rows={coverTemplates}
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
      <Link href={`/coverTemplates/${params.id}`}>${params.row.id}</Link>
    ),
  },
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
