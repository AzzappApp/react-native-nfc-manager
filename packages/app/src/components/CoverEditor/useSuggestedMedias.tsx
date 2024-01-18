import { noop } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import type { useSuggestedMedias_images$key } from '#relayArtifacts/useSuggestedMedias_images.graphql';
import type { useSuggestedMedias_profile$key } from '#relayArtifacts/useSuggestedMedias_profile.graphql';
import type { useSuggestedMedias_videos$key } from '#relayArtifacts/useSuggestedMedias_videos.graphql';
import type { SourceMedia, TemplateKind } from './coverEditorTypes';

const useSuggestedMedias = (
  profileKey: useSuggestedMedias_profile$key | null,
  templateKind: TemplateKind,
) => {
  const profile = useFragment(
    graphql`
      fragment useSuggestedMedias_profile on Profile {
        ...useSuggestedMedias_images
        ...useSuggestedMedias_videos
      }
    `,
    profileKey,
  );

  const {
    data: suggestedImagesData,
    loadNext: loadNextSuggestedImages,
    isLoadingNext: isLoadingNextSuggestedImages,
    hasNext: hasNextSuggestedImages,
  } = usePaginationFragment(
    graphql`
      fragment useSuggestedMedias_images on Profile
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
    profile as useSuggestedMedias_images$key | null,
  );

  const {
    data: suggestedVideosData,
    loadNext: loadNextSuggestedVideos,
    isLoadingNext: isLoadingNextSuggestedVideos,
    hasNext: hasNextSuggestedVideos,
  } = usePaginationFragment(
    graphql`
      fragment useSuggestedMedias_videos on Profile
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
    profile as useSuggestedMedias_videos$key | null,
  );

  const [suggestedMediaIndexes, setSuggesteMediaIndex] = useState({
    image: 0,
    video: 0,
  });

  const mediaKind = templateKind === 'video' ? 'video' : 'image';

  const currentIndex = suggestedMediaIndexes[mediaKind];
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

  const nbSuggestedMedias = list?.edges?.length ?? 0;
  const currentItem = list?.edges?.[currentIndex]?.node ?? null;

  const onNextSuggestedMedia = useCallback(() => {
    setSuggesteMediaIndex(prev => {
      const currentIndex = prev[mediaKind];

      if (currentIndex >= nbSuggestedMedias - 1) {
        if (isLoadingNext) {
          return prev;
        } else {
          return {
            ...prev,
            [mediaKind]: 0,
          };
        }
      }

      return {
        ...prev,
        [mediaKind]: currentIndex + 1,
      };
    });
  }, [isLoadingNext, nbSuggestedMedias, mediaKind]);

  useEffect(() => {
    if (currentIndex % 50 >= 25 && hasNext && !isLoadingNext) {
      loadNext(50);
    }
  }, [hasNext, isLoadingNext, loadNext, mediaKind, currentIndex]);

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
    busy:
      templateKind !== 'people' &&
      isLoadingNext &&
      currentIndex >= nbSuggestedMedias - 1,
    onNextSuggestedMedia: useMemo(() => {
      if (templateKind === 'people') {
        return noop;
      }
      return onNextSuggestedMedia;
    }, [onNextSuggestedMedia, templateKind]),
  };
};

export default useSuggestedMedias;
