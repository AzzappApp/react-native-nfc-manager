'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  CardMedia,
  IconButton,
  Snackbar,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import {
  getImageURLForSize,
  getVideoThumbnailURL,
} from '@azzapp/shared/imagesHelpers';
import DataGrid from '#components/DataGrid';
import { uploadMedia } from '#helpers/mediaHelper';
import { deletePreview, uploadPreview } from './coverTemplatesActions';
import type { ActivityItem } from './[id]/page';
import type { CoverTemplatePreview, CoverTemplate } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

const LoadPreview = ({
  activityId,
  onChange,
}: {
  activityId: string;
  onChange: (activityId: string, coverTemplatePreviewId?: string) => void;
}) => {
  const onClick = useCallback(() => {
    onChange(activityId);
  }, [activityId, onChange]);

  return (
    <Button variant="outlined" type="button" onClick={onClick}>
      <Typography variant="button" component="label" htmlFor="file">
        LOAD A PREVIEW
      </Typography>
    </Button>
  );
};

type CoverTemplatesListProps = {
  coverTemplate: CoverTemplate;
  coverTemplatePreviews: CoverTemplatePreview[];
  activities: ActivityItem[];
};

const CoverTemplatePreviews = ({
  coverTemplate,
  coverTemplatePreviews,
  activities,
}: CoverTemplatesListProps) => {
  const form = useRef<HTMLFormElement>(null);
  const [loading, startLoading] = useState(false);
  const [displayResult, setDisplayResult] = useState(false);
  const [lastResult, action] = useFormState(uploadPreview, null);
  const [preview, setPreview] = useState<{
    activityId: string;
  }>();

  const columns: GridColDef[] = [
    {
      field: 'label',
      headerName: 'Activity',
      flex: 1,
    },
    {
      field: 'activityTypeLabel',
      headerName: 'Activity type',
      flex: 1,
    },
    {
      field: 'coverTemplatePreviewId',
      headerName: 'Preview',
      flex: 1,
      renderCell: params => {
        const preview = coverTemplatePreviews.find(
          ({ companyActivityId }) =>
            companyActivityId === (params.id as string),
        );
        if (!preview) {
          return 'No preview';
        }
        return (
          <Box sx={{ p: 1 }} display="flex">
            <CardMedia
              sx={{ height: 60, width: 37.5 }}
              component="img"
              title={`preview-${params.id}`}
              image={
                preview.mediaId?.startsWith('v')
                  ? getVideoThumbnailURL({
                      id: preview.mediaId,
                      width: 37.5,
                      height: 60,
                    })
                  : getImageURLForSize({ id: preview.mediaId || '' })
              }
            />
            <IconButton
              aria-label="delete"
              size="large"
              onClick={() => {
                onDeletePreview(preview.companyActivityId);
              }}
            >
              <DeleteIcon fontSize="inherit" />
            </IconButton>
          </Box>
        );
      },
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 1,
      renderCell: params => (
        <LoadPreview activityId={params.row.id} onChange={onSelectPreview} />
      ),
    },
  ];

  const onSelectPreview = (activityId: string) => {
    setPreview({
      activityId,
    });
  };

  const onChangeFile = () => {
    if (form.current) {
      startLoading(true);
      form.current.requestSubmit();
    }
  };

  const onDeletePreview = async (activityId: string) => {
    try {
      startLoading(true);
      await deletePreview(coverTemplate.id, activityId);
      startLoading(false);
    } catch (e) {
      console.error(e);
      startLoading(false);
    }
  };

  const handleAction = useCallback(
    async (formData: FormData) => {
      try {
        const fileField = formData.get('file') as File;
        if (fileField?.size > 0) {
          const { public_id } = await uploadMedia(fileField, 'video');
          formData.set(`previewId`, public_id);
        }
        formData.delete('file');

        await action(formData);
      } catch (e) {
        console.error(e);
      } finally {
        startLoading(false);
      }
    },
    [action],
  );

  useEffect(() => {
    if (lastResult) {
      setDisplayResult(true);
      startLoading(false);
      form.current?.reset();
    }
  }, [lastResult]);

  return (
    <form ref={form} action={handleAction} style={{ height: '100%' }}>
      <input
        type="hidden"
        id="coverTemplateId"
        name="coverTemplateId"
        value={coverTemplate.id}
      />
      {preview?.activityId && (
        <input
          type="hidden"
          id="activityId"
          name="activityId"
          value={preview.activityId}
        />
      )}
      <input
        id="file"
        name="file"
        type="file"
        accept="video/*"
        style={{
          display: 'none',
        }}
        onChange={onChangeFile}
      />
      <input
        type="hidden"
        id="coverTemplateId"
        name="coverTemplateId"
        value={coverTemplate.id}
      />
      <DataGrid
        columns={columns}
        rows={activities}
        rowCount={activities?.length}
        loading={loading}
        rowSelection={false}
        rowHeight={100}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
        }}
        sx={{
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'inherit',
          },
        }}
      />
      <Snackbar
        open={displayResult}
        onClose={() => setDisplayResult(false)}
        autoHideDuration={6000}
        message={
          lastResult?.status === 'success'
            ? 'Cover Template preview saved'
            : 'Error in upload preview'
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </form>
  );
};

export default CoverTemplatePreviews;
