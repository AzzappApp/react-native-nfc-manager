import { useMemo } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import type { useTemplateCover_coverTemplates$key } from '#relayArtifacts/useTemplateCover_coverTemplates.graphql';

export function useTemplateCover(key: useTemplateCover_coverTemplates$key) {
  const { data, refetch, isLoadingPrevious, isLoadingNext, loadNext, hasNext } =
    usePaginationFragment(
      graphql`
        fragment useTemplateCover_coverTemplates on Profile
        @refetchable(queryName: "useTemplateCover_coverTemplates_Query")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 2 }
          tagId: { type: ID, defaultValue: null }
        ) {
          coverTemplates(tagId: $tagId, first: $first, after: $after)
            @connection(key: "useTemplateCover_connection_coverTemplates") {
            edges {
              node {
                id
                type {
                  id
                }
                mediaCount
                previews {
                  id
                  media {
                    id
                    uri
                    aspectRatio
                    height
                    width
                  }
                }
              }
            }
          }
        }
      `,
      key,
    );

  const templateCovers = useMemo<CoverTemplatePreviewsByType>(() => {
    const templatesByType = data?.coverTemplates?.edges?.reduce(
      (
        templateByTypeAccumulator: CoverTemplatePreviewsByType,
        currentCoverTemplate,
      ) => {
        const coverTemplate = currentCoverTemplate?.node;

        if (!coverTemplate || !coverTemplate.type?.id)
          return templateByTypeAccumulator;

        const previews = convertToNonNullArray(
          currentCoverTemplate.node.previews?.map(coverTemplatePreview => ({
            coverTemplateId: coverTemplate.id,
            id: coverTemplatePreview.id,
            media: coverTemplatePreview.media!,
            mediaCount: coverTemplate.mediaCount,
          })),
        );

        if (templateByTypeAccumulator[coverTemplate.type.id]) {
          templateByTypeAccumulator[coverTemplate.type.id].push(...previews);
        } else {
          templateByTypeAccumulator[coverTemplate.type.id] = [...previews];
        }

        return templateByTypeAccumulator;
      },
      {},
    );

    return templatesByType ?? {};
  }, [data]);

  return {
    templateCovers,
    refetch,
    isLoadingPrevious,
    isLoadingNext,
    loadNext,
    hasNext,
  };
}

export type CoverTemplatePreviewItem = {
  coverTemplateId: string;
  id: string;
  media: {
    id: string;
    uri: string;
    aspectRatio: number;
    height: number;
    width: number;
  };
  mediaCount: number;
};

export type CoverTemplatePreviewsByType = Record<
  string,
  CoverTemplatePreviewItem[]
>;
