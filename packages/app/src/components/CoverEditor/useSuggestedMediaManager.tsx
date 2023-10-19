import { useCallback, useEffect, useMemo, useState } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import type { CoverData } from './useCoverEditionManager';
import type { useSuggestedMediaManager_suggested$key } from '@azzapp/relay/artifacts/useSuggestedMediaManager_suggested.graphql';

const useSuggestedMediaManager = (
  viewerKey: useSuggestedMediaManager_suggested$key | null | undefined,
) => {
  const {
    data: suggestedMediaData,
    loadNext: loadNextSuggestion,
    isLoadingNext: isLoadingNextSuggestion,
    hasNext: hasNextSuggestion,
  } = usePaginationFragment(
    graphql`
      fragment useSuggestedMediaManager_suggested on Viewer
      @refetchable(queryName: "CoverEditor_suggested_query")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 50 }
      ) {
        suggestedMedias(after: $after, first: $first)
          @connection(key: "CoverEditor_connection_suggestedMedias") {
          edges {
            node {
              __typename
              # we use arbitrary values here, but it should be good enough (arguments in refetchable fragment)
              uri(width: 300, pixelRatio: 2)
              width
              height
            }
          }
        }
      }
    `,
    viewerKey as useSuggestedMediaManager_suggested$key | null,
  );

  const suggestedMediasVideo = useMemo(() => {
    if (suggestedMediaData?.suggestedMedias) {
      return suggestedMediaData.suggestedMedias.edges
        ? convertToNonNullArray(
            suggestedMediaData.suggestedMedias.edges
              .map(edge => {
                return edge?.node;
              })
              .filter(mediaFilter => mediaFilter?.__typename === 'MediaVideo'),
          )
        : [];
    } else {
      return [];
    }
  }, [suggestedMediaData?.suggestedMedias]);

  const suggestedMediasOthers = useMemo(() => {
    if (suggestedMediaData?.suggestedMedias) {
      return suggestedMediaData.suggestedMedias.edges
        ? convertToNonNullArray(
            suggestedMediaData.suggestedMedias.edges
              .map(edge => {
                return edge?.node;
              })
              .filter(mediaFilter => mediaFilter?.__typename === 'MediaImage'),
          )
        : [];
    } else {
      return [];
    }
  }, [suggestedMediaData?.suggestedMedias]);

  const [selectedSuggestedIndex, setSelectedSuggestedIndex] = useState({
    video: 0,
    others: 0,
    people: 0,
  });

  const suggestedMedias = useMemo(
    () => ({
      video: suggestedMediasVideo,
      others: suggestedMediasOthers,
    }),
    [suggestedMediasOthers, suggestedMediasVideo],
  );

  const [suggestedMedia, setSuggestedMedia] = useState<
    CoverData['sourceMedia'] | null
  >(null);

  const selectSuggestedMedia = useCallback(
    (templateKind: 'others' | 'people' | 'video') => {
      if (templateKind === 'people') {
        return null;
      }
      const newIndex =
        selectedSuggestedIndex[templateKind] >=
        suggestedMedias[templateKind].length - 1
          ? 0
          : selectedSuggestedIndex[templateKind] + 1;

      const media = suggestedMedias[templateKind]?.[newIndex];
      if (media) {
        setSuggestedMedia({
          uri: media.uri,
          kind: media.__typename === 'MediaImage' ? 'image' : 'video',
          width: media.width,
          height: media.height,
        });

        if (
          !isLoadingNextSuggestion &&
          newIndex > (suggestedMedias[templateKind]?.length ?? 0) - 3 &&
          hasNextSuggestion
        ) {
          loadNextSuggestion(50);
        }
        setSelectedSuggestedIndex(prev => ({
          ...prev,
          [templateKind]: newIndex,
        }));
      }
    },
    [
      hasNextSuggestion,
      isLoadingNextSuggestion,
      loadNextSuggestion,
      selectedSuggestedIndex,
      setSuggestedMedia,
      suggestedMedias,
    ],
  );

  useEffect(() => {
    if (!suggestedMedia) {
      selectSuggestedMedia('others');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    suggestedMedia,
    selectSuggestedMedia,
  };
};

export default useSuggestedMediaManager;
