import { useMemo } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import type { useCoverTemplates_coverTemplates$key } from '#relayArtifacts/useCoverTemplates_coverTemplates.graphql';

export function useCoverTemplates(
  key: useCoverTemplates_coverTemplates$key | null,
) {
  const { data, refetch, isLoadingPrevious, isLoadingNext, loadNext, hasNext } =
    usePaginationFragment(
      graphql`
        fragment useCoverTemplates_coverTemplates on Profile
        @refetchable(queryName: "useCoverTemplates_coverTemplates_Query")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 2 }
          tagId: { type: ID, defaultValue: null }
        ) {
          coverTemplates(tagId: $tagId, first: $first, after: $after)
            @connection(key: "useCoverTemplates_connection_coverTemplates") {
            edges {
              node {
                id
                type {
                  id
                }
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
                lottie
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
            lottie: coverTemplate.lottie,
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
  lottie: Record<string, unknown>;
};

export type CoverTemplatePreviewsByType = Record<
  string,
  CoverTemplatePreviewItem[]
>;
