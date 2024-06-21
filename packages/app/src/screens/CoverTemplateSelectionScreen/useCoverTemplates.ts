import { useMemo } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import type { useCoverTemplates_coverTemplates$key } from '#relayArtifacts/useCoverTemplates_coverTemplates.graphql';

type UseCoverTemplatesReturnType = {
  templateCovers: CoverTemplatePreviewsByType;
  refetch: (args: {
    first?: number | null;
    after?: string | null;
    tagId?: string | null;
  }) => void;
  isLoadingPrevious: boolean;
  isLoadingNext: boolean;
  loadNext: (nbItems: number) => void;
  hasNext: boolean;
};

export function useCoverTemplates(
  key: useCoverTemplates_coverTemplates$key | null,
): UseCoverTemplatesReturnType {
  const { data, refetch, isLoadingPrevious, isLoadingNext, loadNext, hasNext } =
    usePaginationFragment(
      graphql`
        fragment useCoverTemplates_coverTemplates on WebCard
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
                preview {
                  id
                  ... on MediaImage @alias(as: "image") {
                    uri(width: 512)
                  }
                  ... on MediaVideo @alias(as: "video") {
                    uri(width: 512)
                    thumbnail(width: 512)
                  }
                }
                # Not used in this component but avoid a refetch when
                # on next step
                ...CoverEditor_coverTemplate
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

        const { preview } = coverTemplate;
        const { video, image } = preview ?? {};
        const media = image
          ? ({ kind: 'image', uri: image.uri } as const)
          : video
            ? ({
                kind: 'video',
                uri: video.uri,
                thumbnail: video.thumbnail,
              } as const)
            : null;

        const coverTemplatePreview = media
          ? {
              coverTemplateId: coverTemplate.id,
              media,
            }
          : null;

        if (coverTemplatePreview) {
          if (!templateByTypeAccumulator[coverTemplate.type.id]) {
            templateByTypeAccumulator[coverTemplate.type.id] = [];
          }

          templateByTypeAccumulator[coverTemplate.type.id].push(
            coverTemplatePreview,
          );
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
  media:
    | {
        kind: 'image';
        uri: string;
      }
    | {
        kind: 'video';
        uri: string;
        thumbnail: string;
      };
};

export type CoverTemplatePreviewsByType = Record<
  string,
  CoverTemplatePreviewItem[]
>;
