import { useEffect, useState } from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';
import coverLocalStore from '#components/CoverEditor/coversLocalStore';
import type { CoverEditorState } from '#components/CoverEditor';

const useLocalCover = (coverId: string, saving: boolean) => {
  const [state, setState] = useState<{
    cover: Partial<CoverEditorState> | null;
    loading: boolean;
  }>({
    cover: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const loadCover = async () => {
      const cover = coverLocalStore.getSavedCover();
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
            try {
              return ReactNativeBlobUtil.fs.exists(
                media.uri.replace('file://', ''),
              );
            } catch (e) {
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
    if (!saving) {
      loadCover();
    }
    return () => {
      cancelled = true;
    };
  }, [coverId, saving]);

  return state;
};

export default useLocalCover;
