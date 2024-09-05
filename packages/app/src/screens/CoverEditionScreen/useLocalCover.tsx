import * as Sentry from '@sentry/react-native';
import { useEffect, useState } from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';
import coverLocalStore from '#components/CoverEditor/coversLocalStore';
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
      const medias = [
        ...(cover.medias?.map(({ media }) => media) ?? []),
        ...(cover.overlayLayers?.map(o => o.media) ?? []),
      ];
      const fileExists = (
        await Promise.all(
          medias.map(async media => {
            if (media.uri.startsWith('http')) {
              return true;
            }
            try {
              return ReactNativeBlobUtil.fs.exists(
                media.uri.replace('file://', ''),
              );
            } catch (e) {
              Sentry.captureException(e, {
                extra: {
                  media,
                },
              });
              return false;
            }
          }),
        )
      ).every(Boolean);

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
