import { useMemo } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
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
                    ... on MediaImage @alias(as: "image") {
                      uri(width: 512)
                    }
                    ... on MediaVideo @alias(as: "video") {
                      uri(width: 512)
                      thumbnail(width: 512)
                    }
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

        const previews = convertToNonNullArray(
          currentCoverTemplate.node.previews?.map(coverTemplatePreview => {
            const { media: relayMedia, id } = coverTemplatePreview;
            const { video, image } = relayMedia ?? {};
            const media = image
              ? ({ kind: 'image', uri: image.uri } as const)
              : video
                ? ({
                    kind: 'video',
                    uri: video.uri,
                    thumbnail: video.thumbnail,
                  } as const)
                : null;
            if (!media) {
              return null;
            }
            return {
              id,
              coverTemplateId: coverTemplate.id,
              media,
            };
          }),
        );

        if (!templateByTypeAccumulator[coverTemplate.type.id]) {
          templateByTypeAccumulator[coverTemplate.type.id] = [];
        }

        templateByTypeAccumulator[coverTemplate.type.id].push(...previews);

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
