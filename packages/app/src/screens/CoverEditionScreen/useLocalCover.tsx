import * as Sentry from '@sentry/react-native';
import { File } from 'expo-file-system/next';
import { useEffect, useState } from 'react';
import coverLocalStore, {
  getCoverLocalMediaPath,
} from '#components/CoverEditor/coversLocalStore';
import type { CoverEditorState } from '#components/CoverEditor';

const useLocalCover = (
  saving: boolean,
  webCardId?: string,
  coverId?: string | null,
) => {
  const [state, setState] = useState<{
    cover: Partial<CoverEditorState> | null;
    loading: boolean;
  }>({
    cover: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const loadCover = async (params: {
      webCardId: string;
      coverId: string;
    }) => {
      const cover = coverLocalStore.getSavedCover(params.webCardId);
      if (!cover || cover.coverId !== coverId) {
        setState({
          cover: null,
          loading: false,
        });
        return;
      }
      const { localFilenames, medias: coverMedias, overlayLayers } = cover;
      const medias = [...(coverMedias ?? []), ...(overlayLayers ?? [])];
      const fileExists = medias
        .map(media => {
          try {
            if (localFilenames?.[media.id]) {
              const file = new File(
                getCoverLocalMediaPath(localFilenames[media.id]),
              );
              if (file.exists) {
                return true;
              } else {
                // the media has been deleted from the device
                // we need to download it again
                delete localFilenames[media.id];
              }
            }

            if (media.uri.startsWith('http')) {
              return true;
            }
            const file = new File(media.uri);
            return file.exists;
          } catch (e) {
            Sentry.captureException(e, {
              extra: {
                media,
              },
            });
            return false;
          }
        })
        .every(Boolean);

      if (cancelled) {
        return;
      }

      setState({
        cover: fileExists ? cover : null,
        loading: false,
      });
    };

    if (!saving && webCardId && coverId) {
      loadCover({
        webCardId,
        coverId,
      });
    } else if (!saving && !(webCardId && coverId)) {
      setState({
        cover: null,
        loading: false,
      });
    }
    return () => {
      cancelled = true;
    };
  }, [saving, webCardId, coverId]);

  return state;
};

export default useLocalCover;
