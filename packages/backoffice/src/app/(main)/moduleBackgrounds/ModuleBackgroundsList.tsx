'use client';
import { Box, Button, Dialog, DialogContent, Typography } from '@mui/material';
import * as Sentry from '@sentry/nextjs';
import { useOptimistic, useState } from 'react';
import { uploadMedia } from '#helpers/mediaHelper';
import {
  addModuleBackgrounds,
  reorderModuleBackgrounds,
  setModuleBackgroundEnabled,
} from './moduleBackgroundActions';
import ModuleBackgroundAddForm from './ModuleBackgroundAddForm';
import ModuleBackgroundSection from './ModuleBackgroundSection';
import type { ModuleBackground } from '@azzapp/data';

type ModuleBackgroundsListProps = {
  moduleBackgrounds: ModuleBackground[];
};

const ModuleBackgroundsList = ({
  moduleBackgrounds,
}: ModuleBackgroundsListProps) => {
  const [optimisticModuleBackgrounds, dispatchOptimistic] = useOptimistic<
    ModuleBackground[],
    | {
        type: 'SET_ENABLED';
        mediaId: string;
        enabled: boolean;
      }
    | {
        type: 'SET_ORDER';
        mediasIds: string[];
      }
  >(moduleBackgrounds, (state, action) => {
    switch (action.type) {
      case 'SET_ORDER':
        return state
          .map(media => {
            const newOrder = action.mediasIds.indexOf(media.id);
            if (newOrder !== -1) {
              return {
                ...media,
                order: newOrder,
              };
            }
            return media;
          })
          .sort((a, b) => a.order - b.order);
      case 'SET_ENABLED':
        return state.map(media => {
          if (media.id === action.mediaId) {
            return {
              ...media,
              enabled: action.enabled,
            };
          }
          return media;
        });
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<any>(null);

  const saveMedias = async (
    medias: File[],
    resizeMode: 'center' | 'contain' | 'cover' | 'repeat' | 'stretch',
  ) => {
    setUploading(true);
    try {
      const mediaIds = await Promise.all(
        medias.map(async media => {
          const { public_id } = await uploadMedia(media, 'image');
          return public_id;
        }),
      );

      await addModuleBackgrounds({
        medias: mediaIds,
        resizeMode,
      });
    } catch (error) {
      setUploading(false);
      setSaveError(error);
      return;
    }

    setUploading(false);
  };

  const onMediasOrderChange = async (medias: ModuleBackground[]) => {
    const mediasIds = medias.map(media => media.id);
    try {
      dispatchOptimistic({
        type: 'SET_ORDER',
        mediasIds,
      });
      await reorderModuleBackgrounds(mediasIds);
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const onSetEnabled = async (mediaId: string, enabled: boolean) => {
    try {
      dispatchOptimistic({
        type: 'SET_ENABLED',
        mediaId,
        enabled,
      });
      await setModuleBackgroundEnabled(mediaId, enabled);
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Module Backgrounds
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowForm(true)}
        >
          Add
        </Button>
      </Box>
      <ModuleBackgroundSection
        value={optimisticModuleBackgrounds}
        onChange={onMediasOrderChange}
        onSetEnabled={onSetEnabled}
      />
      <ModuleBackgroundAddForm
        label="Add Module Backgrounds"
        open={showForm}
        handleClose={() => setShowForm(false)}
        onAdd={saveMedias}
        error={saveError}
      />
      <Dialog open={uploading}>
        <DialogContent>Uploading ...</DialogContent>
      </Dialog>
    </Box>
  );
};

export default ModuleBackgroundsList;
