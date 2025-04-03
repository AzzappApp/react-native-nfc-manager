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
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useDeferredValue, useState } from 'react';
import DataGrid from '#components/DataGrid';
import type { CardTemplateTypeItem } from './page';
import type { SelectChangeEvent } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';

type CardTemplateTypesListProps = {
  cardTemplateTypes: CardTemplateTypeItem[];
};

type StatusFilter = 'All' | 'Disabled' | 'Enabled';

const CardTemplateTypesList = ({
  cardTemplateTypes,
}: CardTemplateTypesListProps) => {
  const router = useRouter();
  const [currentSearch, setCurrentSearch] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(currentSearch);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const onStatusChange = useCallback((event: SelectChangeEvent) => {
    const newStatus = event.target.value as StatusFilter;
    setStatusFilter(newStatus);
  }, []);

  const filteredCardTemplateTypes = cardTemplateTypes.filter(
    type =>
      (statusFilter === 'All' ||
        (type.status ? 'Enabled' : 'Disabled') === statusFilter) &&
      (!deferredSearch ||
        type.label?.toLowerCase().includes(deferredSearch.toLowerCase())),
  );

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            margin="normal"
            name="search"
            label="Search"
            type="text"
            onChange={e => setCurrentSearch(e.target.value)}
            value={currentSearch}
            sx={{ mb: 2, width: 300 }}
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
              label="Business status"
              onChange={onStatusChange}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Enabled">Enabled</MenuItem>
              <MenuItem value="Disabled">Disabled</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" alignItems="center">
          <Button
            variant="contained"
            onClick={() => {
              router.push('/cardTemplateTypes/add');
            }}
          >
            NEW TYPE
          </Button>
        </Box>
      </Box>

      <DataGrid
        columns={columns}
        rows={filteredCardTemplateTypes}
        onRowClick={params => {
          router.push(`/cardTemplateTypes/${params.id}`);
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
    </>
  );
};

const columns: GridColDef[] = [
  {
    field: 'label',
    headerName: 'Label',
    flex: 2,
  },
  {
    field: 'category',
    headerName: 'Category',
    flex: 2,
  },
  {
    field: 'templatesCount',
    headerName: 'Templates',
    flex: 1,
  },
  {
    field: 'status',
    headerName: 'Status',
    renderCell: params => (
      <Chip
        color={params.value ? 'warning' : 'default'}
        label={params.value ? 'Enabled' : 'Disabled'}
      />
    ),
    flex: 1,
  },
];

export default CardTemplateTypesList;
