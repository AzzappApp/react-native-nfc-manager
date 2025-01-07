'use client';

import { People } from '@mui/icons-material';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogContent,
  Snackbar,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ColorInput from '#components/ColorInput';
import MediaInput from '#components/MediaInput';
import { useForm } from '#helpers/formHelpers';
import { uploadMedia } from '#helpers/mediaHelper';
import { savePredefinedCover } from './PredefinedCoverActions';
import type { PredefinedCoverErrors } from './predefinedCoverSchema';
import type { CoverPredefined } from '@azzapp/data';

type FormValue = {
  media: File | string;
  primary: string;
  dark: string;
  light: string;
};

const PredefinedCoverForm = ({
  predefinedCover,
}: {
  predefinedCover?: CoverPredefined;
}) => {
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [formErrors, setFormErrors] = useState<PredefinedCoverErrors | null>(
    null,
  );

  const router = useRouter();

  const { data, fieldProps } = useForm<FormValue>(
    () => {
      return {
        id: predefinedCover?.id,
        mediaId: predefinedCover?.mediaId,
        primary: predefinedCover?.defaultTriptychColors.primary,
        dark: predefinedCover?.defaultTriptychColors.dark,
        light: predefinedCover?.defaultTriptychColors.light,
      };
    },
    formErrors?.fieldErrors,
    [],
  );

  const [saving, startSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startSaving(true);
    setFormErrors(null);
    if (media) {
      let result;
      try {
        if (typeof media !== 'string') {
          console.error('media should be a string here');
          setError('media is not a string');
          return;
        }
        result = await savePredefinedCover({
          ...data,
          mediaId: media,
        });
      } catch (error) {
        setError('cannot save predefined cover: ' + error);
      }
      if (result?.success) {
        setError(undefined);
        setDisplaySaveSuccess(true);
        router.replace(`/predefinedCovers/`);
      } else {
        setFormErrors(result?.formErrors);
      }
    }
    startSaving(false);
  };

  const [media, setMedia] = useState<File | string | undefined>(
    predefinedCover?.mediaId,
  );

  const mediaValue =
    typeof media === 'string'
      ? {
          id: media,
          kind: media.startsWith('v_')
            ? ('video' as const)
            : ('image' as const),
        }
      : (media ?? null);

  const onMediaChange = async (media: File | string | null | undefined) => {
    if (media instanceof File) {
      setUploading(true);
      try {
        const { public_id } = await uploadMedia(
          media,
          media.type.startsWith('image') ? 'image' : 'video',
        );
        setMedia(public_id);
        setUploading(false);
      } catch (e) {
        setUploading(false);
        throw e;
      }
    }
  };

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/webCardCategories"
        >
          <People sx={{ mr: 0.5 }} fontSize="inherit" />
          Categories
        </Link>
      </Breadcrumbs>
      <Typography variant="h4" component="h1">
        New predefined cover
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: 2,
        }}
        component="form"
        onSubmit={handleSubmit}
      >
        <MediaInput
          label="Media"
          name="media"
          kind="mixed"
          {...fieldProps('media')}
          value={mediaValue}
          onChange={file => {
            onMediaChange(file);
          }}
          showDeleteIcon={false}
        />
        <ColorInput
          name="primary"
          label="Primary color"
          required
          disabled={saving}
          {...fieldProps('primary')}
        />
        <ColorInput
          name="dark"
          label="Dark color"
          required
          disabled={saving}
          {...fieldProps('dark')}
        />
        <ColorInput
          name="light"
          label="Light color"
          required
          disabled={saving}
          {...fieldProps('light')}
        />

        <Box>
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={saving}
          >
            Save
          </Button>
        </Box>
        {error && (
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        )}
      </Box>
      <Dialog open={uploading}>
        <DialogContent>Uploading ...</DialogContent>
      </Dialog>
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => setDisplaySaveSuccess(false)}
        autoHideDuration={6000}
        message="WebCardCategory saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default PredefinedCoverForm;
