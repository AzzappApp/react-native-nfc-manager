'use client';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import DataGrid from '#components/DataGrid';
import type { ColorPalette } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

type ColorPalettesListProps = {
  colorPalettes: ColorPalette[];
  pageSize: number;
};

const ColorPalettesList = ({
  colorPalettes,
  pageSize,
}: ColorPalettesListProps) => {
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
        Colors
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
            router.push('/colorPalettes/add');
          }}
        >
          NEW COLOR
        </Button>
      </Box>
      <DataGrid
        columns={columns}
        rows={colorPalettes}
        pageSizeOptions={[pageSize]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
        onRowClick={params => {
          router.push(`/colorPalettes/${params.id}`);
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

// eslint-disable-next-line react/display-name
const renderColor = (field: string) => (params: any) => (
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
    field: 'primary',
    headerName: 'Primary Color',
    flex: 1,
    renderCell: renderColor('primary'),
  },
  {
    field: 'dark',
    headerName: 'Dark Color',
    flex: 1,
    renderCell: renderColor('dark'),
  },
  {
    field: 'light',
    headerName: 'Light Color',
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
