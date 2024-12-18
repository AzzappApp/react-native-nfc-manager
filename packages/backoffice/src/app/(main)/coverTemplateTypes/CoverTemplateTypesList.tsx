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
import { DataGrid } from '@mui/x-data-grid';
import { useRouter } from 'next/navigation';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import type { CoverTemplateTypeItem } from './page';
import type { SelectChangeEvent } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';

type Props = {
  coverTemplateTypes: CoverTemplateTypeItem[];
};

type StatusFilter = 'All' | 'Disabled' | 'Enabled';

const CoverTemplateTypesList = ({ coverTemplateTypes }: Props) => {
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
      coverTemplateTypes.filter(
        item =>
          (statusFilter === 'All' ||
            (item.enabled ? 'Enabled' : 'Disabled') === statusFilter) &&
          (!deferredSearch ||
            item.label?.toLowerCase().includes(deferredSearch.toLowerCase())),
      ),
    [coverTemplateTypes, deferredSearch, statusFilter],
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
              router.push('/coverTemplateTypes/add');
            }}
          >
            NEW TYPE
          </Button>
        </Box>
      </Box>
      <DataGrid
        columns={columns}
        rows={items}
        onRowClick={params => {
          router.push(`/coverTemplateTypes/${params.id}`);
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
    flex: 1,
  },
  {
    field: 'templatesCount',
    headerName: 'Templates',
    flex: 1,
  },
  {
    field: 'enabled',
    headerName: 'Status',
    renderCell: params => (
      <Chip
        color={params.value ? 'warning' : 'default'}
        label={params.value ? 'Enabled' : 'Disabled'}
      />
    ),
  },
];

export default CoverTemplateTypesList;
