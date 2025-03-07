'use client';

import { Box, Typography } from '@mui/material';
import DataGrid from '#components/DataGrid';
import type { TermsOfUse } from '@azzapp/data/src/schema';
import type { GridColDef } from '@mui/x-data-grid';

type TermsOfUseListProps = {
  termsOfUse: TermsOfUse[];
};

const TermsOfUseList = ({ termsOfUse }: TermsOfUseListProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Terms of use list
      </Typography>

      <DataGrid
        columns={columns}
        getRowId={({ version }) => version}
        rows={termsOfUse}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          },
        }}
        rowSelection={false}
      />
    </Box>
  );
};

const columns: GridColDef[] = [
  {
    field: 'version',
    headerName: 'Version',
    flex: 1,
  },

  {
    field: 'createdAt',
    headerName: 'Date',
    type: 'date',
    flex: 1,
  },
];

export default TermsOfUseList;
