'use client';
import { Box, Button, Dialog, DialogContent, Typography } from '@mui/material';
import { experimental_useOptimistic as useOptimistic, useState } from 'react';
import { uploadMedia } from '@azzapp/shared/WebAPI';
import { getSignedUpload } from '#app/mediaActions';
import {
  addStaticMedias,
  reorderStaticMedias,
  setStaticMediaEnabled,
} from './staticMediaActions';
import StaticMediaAddForm from './StaticMediaAddForm';
import StaticMediaSection from './StaticMediaSection';
import type { StaticMedia } from '@azzapp/data/domains';

type StaticMediasListProps = {
  staticMedias: StaticMedia[];
};

const StaticMediasList = ({ staticMedias }: StaticMediasListProps) => {
  const [optimisticStaticMedias, dispatchOptimistic] = useOptimistic<
    StaticMedia[],
    | {
        type: 'SET_ENABLED';
        mediaId: string;
        enabled: boolean;
      }
    | {
        type: 'SET_ORDER';
        mediasIds: string[];
      }
  >(staticMedias, (state, action) => {
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

  const [addingMediaUsage, setAddingMediaUsage] = useState<
    'coverBackground' | 'coverForeground' | 'moduleBackground' | null
  >(null);

  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<any>(null);

  const saveMedias = async (
    medias: File[],
    resizeMode: 'center' | 'contain' | 'cover' | 'repeat' | 'stretch',
  ) => {
    setUploading(true);
    try {
      const mediaToUploads = await Promise.all(
        medias.map(async media => ({
          media,
          ...(await getSignedUpload(
            'image',
            addingMediaUsage !== 'moduleBackground' ? 'cover' : null,
          )),
        })),
      );
      const mediaIds = await Promise.all(
        mediaToUploads.map(async ({ media, uploadParameters, uploadURL }) => {
          const { public_id } = await uploadMedia(
            media,
            uploadURL,
            uploadParameters,
          ).promise;
          return public_id as string;
        }),
      );

      await addStaticMedias({
        medias: mediaIds,
        usage: addingMediaUsage!,
        resizeMode,
      });
    } catch (error) {
      setUploading(false);
      setSaveError(error);
      return;
    }

    setUploading(false);
    setAddingMediaUsage(null);
  };

  const onMediasOrderChange = async (medias: StaticMedia[]) => {
    const mediasIds = medias.map(media => media.id);
    try {
      dispatchOptimistic({
        type: 'SET_ORDER',
        mediasIds,
      });
      await reorderStaticMedias(mediasIds);
    } catch (error) {
      console.error(error);
    }
  };

  const onSetEnabled = async (mediaId: string, enabled: boolean) => {
    try {
      dispatchOptimistic({
        type: 'SET_ENABLED',
        mediaId,
        enabled,
      });
      await setStaticMediaEnabled(mediaId, enabled);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        StaticMedias
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {Object.keys(usageLabels).map(usage => (
          <Box key={usage}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              {usageLabels[usage]}
            </Typography>
            <StaticMediaSection
              value={optimisticStaticMedias.filter(
                media => media.usage === usage,
              )}
              onChange={onMediasOrderChange}
              onSetEnabled={onSetEnabled}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => setAddingMediaUsage(usage as any)}
            >
              Add
            </Button>
          </Box>
        ))}

        {addingMediaUsage && (
          <StaticMediaAddForm
            label={`Add ${usageLabels[addingMediaUsage]}`}
            open={!!addingMediaUsage}
            handleClose={() => setAddingMediaUsage(null)}
            onAdd={saveMedias}
            error={saveError}
          />
        )}

        <Dialog open={uploading}>
          <DialogContent>Uploading ...</DialogContent>
        </Dialog>
      </Box>
    </>
  );
};

export default StaticMediasList;

const usageLabels: Record<string, string> = {
  coverBackground: 'Cover Backgrounds',
  coverForeground: 'Cover Foregrounds',
  moduleBackground: 'Module Backgrounds',
};
