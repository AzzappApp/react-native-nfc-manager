'use client';
import { Search } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import DataGrid from '#components/DataGrid';
import type { ColorPalette } from '@azzapp/data';
import type { SelectChangeEvent } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';

type ColorPalettesListProps = {
  colorPalettes: ColorPalette[];
};

type StatusFilter = 'All' | 'Disabled' | 'Enabled';

const ColorPalettesList = ({ colorPalettes }: ColorPalettesListProps) => {
  const router = useRouter();
  const [currentSearch, setCurrentSearch] = useState('');
  const deferredSearch = useDeferredValue(currentSearch);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const onStatusChange = useCallback((event: SelectChangeEvent) => {
    const newStatus = event.target.value as StatusFilter;
    setStatusFilter(newStatus);
  }, []);

  const items = useMemo(
    () =>
      colorPalettes.filter(
        item =>
          (statusFilter === 'All' ||
            (item.enabled ? 'Enabled' : 'Disabled') === statusFilter) &&
          (!deferredSearch ||
            item.id.toLowerCase().includes(deferredSearch.toLowerCase())),
      ),
    [colorPalettes, deferredSearch, statusFilter],
  );

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
      <Box display="flex" justifyContent="space-between" gap={2} mb={2} mt={2}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            margin="normal"
            name="search"
            label="Search"
            type="text"
            onChange={e => setCurrentSearch(e.target.value)}
            value={currentSearch}
            sx={{ mb: 2, width: 500 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ width: 130 }}>
            <InputLabel id="status">Status</InputLabel>
            <Select
              labelId="status"
              id="status"
              value={statusFilter}
              label="Status"
              onChange={onStatusChange}
            >
              <MenuItem value={'All'}>All</MenuItem>
              <MenuItem value={'Enabled'}>Enabled</MenuItem>
              <MenuItem value={'Disabled'}>Disabled</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" alignItems="center" gap={2} mb={2} mt={2}>
          <Button
            variant="contained"
            onClick={() => {
              router.push('/colorPalettes/add');
            }}
          >
            NEW COLOR
          </Button>
        </Box>
      </Box>
      <DataGrid
        columns={columns}
        rows={items}
        onRowClick={params => {
          router.push(`/colorPalettes/${params.id}`);
        }}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          },
        }}
        pageSizeOptions={[25]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
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
    field: 'id',
    headerName: 'ID',
    width: 250,
  },

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
    headerName: 'Status',
    type: 'boolean',
    width: 100,
    renderCell: params => (
      <Chip
        color={params.value ? 'warning' : 'default'}
        label={params.value ? 'Enabled' : 'Disabled'}
      />
    ),
  },
];

export default ColorPalettesList;
