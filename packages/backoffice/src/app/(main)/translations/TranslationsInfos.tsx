'use client';

import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useRouter } from 'next/navigation';
import type { GridColDef } from '@mui/x-data-grid';

type LocaleInfo = {
  locale: string;
  name: string;
  app: {
    translated: number;
    total: number;
  };
  web: {
    translated: number;
    total: number;
  };
};

type TranslationsInfosProps = {
  translationsInfos: LocaleInfo[];
};

const TranslationsInfos = ({ translationsInfos }: TranslationsInfosProps) => {
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
        Translations
      </Typography>

      <DataGrid
        columns={columns}
        rows={translationsInfos}
        getRowId={row => row.locale}
        onRowClick={params => {
          router.push(`/translations/${params.id}`);
        }}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          },
          '& .translated': {
            color: 'green',
          },
          '& .not-translated': {
            color: 'red',
          },
        }}
        hideFooter
      />
    </Box>
  );
};

const getPercentTranslated = (params: any) => {
  if (params.value.total === 0) {
    return 'No messages';
  }
  return `${params.value.translated}/${params.value.total} translated`;
};

const getPercentTranslatedColor = (params: any) => {
  if (params.value.total === 0) {
    return '';
  }
  if (params.value.translated === params.value.total) {
    return 'translated';
  }
  return 'not-translated';
};

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Language',
    flex: 1,
  },
  {
    field: 'app',
    headerName: 'App Status',
    cellClassName: getPercentTranslatedColor,
    valueFormatter: getPercentTranslated,
    flex: 1,
  },
  {
    field: 'web',
    headerName: 'Web Status',
    cellClassName: getPercentTranslatedColor,
    valueFormatter: getPercentTranslated,
    flex: 1,
  },
];

export default TranslationsInfos;
