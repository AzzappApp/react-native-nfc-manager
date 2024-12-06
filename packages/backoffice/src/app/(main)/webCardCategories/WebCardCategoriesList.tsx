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
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import DataGrid from '#components/DataGrid';
import type { LocalizationMessage, WebCardCategory } from '@azzapp/data';
import type { SelectChangeEvent } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';

type WebCardCategoriesListProps = {
  webCardCategories: WebCardCategory[];
  labels: Array<LocalizationMessage | null>;
};

const WebCardCategoriesList = ({
  webCardCategories,
  labels,
}: WebCardCategoriesListProps) => {
  const router = useRouter();
  const [currentSearch, setCurrentSearch] = useState('');
  const deferredSearch = useDeferredValue(currentSearch);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'disabled' | 'enabled'
  >('all');

  const onStatusChange = useCallback((event: SelectChangeEvent) => {
    const newStatus = event.target.value;
    setStatusFilter(newStatus as 'all' | 'disabled' | 'enabled');
  }, []);

  const items = useMemo(() => {
    const labelsMap = labels.reduce(
      (acc, label) => {
        if (label) {
          acc[label.key] = label.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );
    return webCardCategories
      .map(category => ({
        ...category,
        label: labelsMap[category.id] ?? category.id,
      }))
      .filter(category => {
        if (
          statusFilter !== 'all' &&
          category.enabled !== (statusFilter === 'enabled')
        ) {
          return false;
        }
        if (deferredSearch) {
          return category.label
            .toLowerCase()
            .includes(deferredSearch.toLowerCase());
        }
        return true;
      });
  }, [deferredSearch, labels, statusFilter, webCardCategories]);

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
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="enabled">Enabled</MenuItem>
              <MenuItem value="disabled">Disabled</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" alignItems="center">
          <Button
            variant="contained"
            onClick={() => {
              router.push('/webCardCategories/add');
            }}
          >
            NEW CATEGORY
          </Button>
        </Box>
      </Box>
      <DataGrid
        columns={columns}
        rows={items}
        onRowClick={params => {
          router.push(`/webCardCategories/${params.id}`);
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
    field: 'webCardKind',
    headerName: 'Profile kind',
    flex: 1,
  },
  {
    field: 'order',
    headerName: 'Order',
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

export default WebCardCategoriesList;
