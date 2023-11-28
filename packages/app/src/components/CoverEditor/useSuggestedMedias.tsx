import { noop } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import type { SourceMedia, TemplateKind } from './coverEditorTypes';
import type { useSuggestedMedias_images$key } from '@azzapp/relay/artifacts/useSuggestedMedias_images.graphql';
import type { useSuggestedMedias_videos$key } from '@azzapp/relay/artifacts/useSuggestedMedias_videos.graphql';
import type { useSuggestedMedias_viewer$key } from '@azzapp/relay/artifacts/useSuggestedMedias_viewer.graphql';

const useSuggestedMedias = (
  viewerKey: useSuggestedMedias_viewer$key | null,
  templateKind: TemplateKind,
) => {
  const viewer = useFragment(
    graphql`
      fragment useSuggestedMedias_viewer on Viewer {
        ...useSuggestedMedias_images
        ...useSuggestedMedias_videos
      }
    `,
    viewerKey,
  );

  const {
    data: suggestedImagesData,
    loadNext: loadNextSuggestedImages,
    isLoadingNext: isLoadingNextSuggestedImages,
    hasNext: hasNextSuggestedImages,
  } = usePaginationFragment(
    graphql`
      fragment useSuggestedMedias_images on Viewer
      @refetchable(queryName: "CoverEditor_suggestedImages_query")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 50 }
      ) {
        suggestedImages: suggestedMedias(
          kind: image
          after: $after
          first: $first
        ) @connection(key: "CoverEditor_connection_suggestedImages") {
          edges {
            node {
              id
              uri(width: 256, pixelRatio: 2)
              rawUri: uri(raw: true)
              width
              height
            }
          }
        }
      }
    `,
    viewer as useSuggestedMedias_images$key | null,
  );

  const {
    data: suggestedVideosData,
    loadNext: loadNextSuggestedVideos,
    isLoadingNext: isLoadingNextSuggestedVideos,
    hasNext: hasNextSuggestedVideos,
  } = usePaginationFragment(
    graphql`
      fragment useSuggestedMedias_videos on Viewer
      @refetchable(queryName: "CoverEditor_suggestedVideos_query")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 50 }
      ) {
        suggestedVideos: suggestedMedias(
          kind: video
          after: $after
          first: $first
        ) @connection(key: "CoverEditor_connection_suggestedVideos") {
          edges {
            node {
              id
              uri(width: 256, pixelRatio: 2)
              rawUri: uri(raw: true)
              width
              height
            }
          }
        }
      }
    `,
    viewer as useSuggestedMedias_videos$key | null,
  );

  const [suggestedMediaIndexes, setSuggesteMediaIndex] = useState({
    image: 0,
    video: 0,
  });

  const mediaKind = templateKind === 'video' ? 'video' : 'image';

  const index = suggestedMediaIndexes[mediaKind];
  const list =
    mediaKind === 'image'
      ? suggestedImagesData?.suggestedImages ?? null
      : suggestedVideosData?.suggestedVideos ?? null;
  const hasNext =
    mediaKind === 'image' ? hasNextSuggestedImages : hasNextSuggestedVideos;
  const isLoadingNext =
    mediaKind === 'image'
      ? isLoadingNextSuggestedImages
      : isLoadingNextSuggestedVideos;
  const loadNext =
    mediaKind === 'image' ? loadNextSuggestedImages : loadNextSuggestedVideos;

  const currentItem = list?.edges?.[index]?.node ?? null;

  const onNextSuggestedMedia = useCallback(() => {
    setSuggesteMediaIndex(prev => {
      const currentIndex = prev[mediaKind];

      return {
        ...prev,
        [mediaKind]:
          currentIndex >= (list?.edges?.length ?? 0) - 1 ? 0 : currentIndex + 1,
      };
    });
  }, [list?.edges?.length, mediaKind]);

  useEffect(() => {
    const currentIndex = suggestedMediaIndexes[mediaKind];
    if (
      currentIndex >= (list?.edges?.length ?? 0) / 2 &&
      hasNext &&
      !isLoadingNext
    ) {
      loadNext(50);
    }
  }, [
    hasNext,
    isLoadingNext,
    list?.edges?.length,
    loadNext,
    mediaKind,
    suggestedMediaIndexes,
  ]);

  const suggestedMedia = useMemo<SourceMedia | null>(() => {
    if (templateKind === 'people' || !currentItem) {
      return null;
    }
    return {
      id: currentItem.id,
      uri: currentItem.uri,
      width: currentItem.width,
      height: currentItem.height,
      kind: mediaKind,
    };
  }, [currentItem, mediaKind, templateKind]);

  return {
    suggestedMedia,
    onNextSuggestedMedia: useMemo(() => {
      if (templateKind === 'people') {
        return noop;
      }
      return onNextSuggestedMedia;
    }, [onNextSuggestedMedia, templateKind]),
  };
};

export default useSuggestedMedias;
