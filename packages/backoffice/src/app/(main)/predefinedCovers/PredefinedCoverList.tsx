'use client';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, CardMedia, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { type CoverPredefined } from '@azzapp/data';
import {
  getImageURLForSize,
  getVideoThumbnailURL,
} from '@azzapp/shared/imagesHelpers';
import DataGrid from '#components/DataGrid';
import { deletePredefinedCover } from './PredefinedCoverActions';
import type { GridColDef } from '@mui/x-data-grid';

type PredefinedCoverListProps = {
  predefinedCovers: CoverPredefined[];
};

const rowHeight = 300;

// eslint-disable-next-line react/display-name
const renderColor = (field: string) => (params: any) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Box
      sx={{
        width: 100,
        height: 30,
        backgroundColor: params.row[field],
        border: `1px solid #000`,
      }}
    />
    <textarea defaultValue={params.row[field]} />
  </Box>
);

const PredefinedCoverList = ({
  predefinedCovers,
}: PredefinedCoverListProps) => {
  const router = useRouter();
  const data = useMemo(() => {
    return predefinedCovers.map(predefined => {
      return {
        id: predefined.id,
        mediaId: predefined.mediaId,
        dark: predefined.defaultTriptychColors.dark,
        light: predefined.defaultTriptychColors.light,
        primary: predefined.defaultTriptychColors.primary,
      };
    });
  }, [predefinedCovers]);
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box display="flex" alignItems="center">
          <Button
            variant="contained"
            onClick={() => {
              router.push('/predefinedCovers/add');
            }}
          >
            NEW PREDEFINED COVER
          </Button>
        </Box>
      </Box>
      <DataGrid
        columns={columns}
        rows={data}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          },
        }}
        getRowHeight={() => rowHeight}
        pageSizeOptions={[25]}
        rowSelection={false}
        sortingOrder={['asc', 'desc']}
      />
    </>
  );
};

const DeleteButton = (data: any) => {
  const router = useRouter();

  return (
    <IconButton
      aria-label="delete"
      size="large"
      onClick={() => {
        deletePredefinedCover(data.id);
        router.refresh();
      }}
    >
      <DeleteIcon fontSize="inherit" />
    </IconButton>
  );
};

const EditButton = (data: any) => {
  const router = useRouter();
  return (
    <IconButton
      aria-label="edit"
      size="large"
      onClick={() => {
        router.push(`/predefinedCovers/${data.id}/`);
      }}
    >
      <EditIcon fontSize="inherit" />
    </IconButton>
  );
};

const columns: GridColDef[] = [
  {
    field: 'media',
    headerName: 'Media',
    flex: 1,
    renderCell: params => {
      const mediaId = params?.row?.mediaId;
      return (
        <Box sx={{ p: 1 }} display="flex">
          <CardMedia
            sx={{ height: rowHeight - 10 }}
            component="img"
            title={`preview-${params.id}`}
            image={
              mediaId.startsWith('v')
                ? getVideoThumbnailURL({
                    id: mediaId,
                    height: rowHeight - 10,
                  })
                : getImageURLForSize({ id: mediaId || '' })
            }
          />
        </Box>
      );
    },
  },
  {
    field: 'primary',
    headerName: 'Primary',
    renderCell: renderColor('primary'),
  },
  {
    field: 'dark',
    headerName: 'Dark',
    renderCell: renderColor('dark'),
  },
  {
    field: 'light',
    headerName: 'Light',
    renderCell: renderColor('light'),
  },
  {
    field: 'delete',
    headerName: 'Delete',
    renderCell: DeleteButton,
  },
  {
    field: 'edit',
    headerName: 'Edit',
    renderCell: EditButton,
  },
];

export default PredefinedCoverList;
