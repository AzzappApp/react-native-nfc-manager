'use client';
import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import DataGrid from '#components/DataGrid';
import type { ColorPalette } from '@azzapp/data/domains';
import type { GridColDef } from '@mui/x-data-grid';

type ColorPalettesListProps = {
  colorPalettes: ColorPalette[];
};

const ColorPalettesList = ({ colorPalettes }: ColorPalettesListProps) => {
  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        ColorPalettes
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2,
        }}
      >
        <Link href="/colorPalettes/add">
          <Typography variant="body1">+ New ColorPalette</Typography>
        </Link>
      </Box>
      <DataGrid
        columns={columns}
        rows={colorPalettes}
        pageSizeOptions={[25]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
      />
    </>
  );
};

// eslint-disable-next-line react/display-name
const renderColor = (field: string) => (params: any) =>
  (
    <Box
      sx={{
        width: 100,
        height: 30,
        backgroundColor: params.row[field],
        border: `1px solid #000`,
      }}
    />
  );

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 250,
    renderCell: params => (
      <Link href={`/colorPalettes/${params.id}`}>${params.row.id}</Link>
    ),
  },
  {
    field: 'primary',
    headerName: 'Primary Color',
    flex: 1,
    renderCell: renderColor('primary'),
  },
  {
    field: 'dark',
    headerName: 'Secondary Color',
    flex: 1,
    renderCell: renderColor('dark'),
  },
  {
    field: 'light',
    headerName: 'Background Color',
    flex: 1,
    renderCell: renderColor('light'),
  },
  {
    field: 'enabled',
    headerName: 'Inscription date',
    type: 'boolean',
    width: 100,
  },
];

export default ColorPalettesList;
