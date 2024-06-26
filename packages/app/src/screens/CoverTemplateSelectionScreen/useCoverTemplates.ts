import { graphql, usePaginationFragment } from 'react-relay';
import type {
  useCoverTemplates_coverTemplates$key,
  useCoverTemplates_coverTemplates$data,
} from '#relayArtifacts/useCoverTemplates_coverTemplates.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
type UseCoverTemplatesReturnType = {
  coverTemplateByType: CoverTemplateTypeListItem[];
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
          first: { type: Int, defaultValue: 5 }
          tagId: { type: ID, defaultValue: null }
          pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
        ) {
          coverTemplates(tagId: $tagId, first: $first, after: $after)
            @connection(key: "useCoverTemplates_connection_coverTemplates") {
            edges {
              node {
                id
                label
                data {
                  id
                  requiredMedias
                  preview {
                    id
                    ... on MediaImage @alias(as: "image") {
                      uri(width: 512, pixelRatio: $pixelRatio)
                    }
                    ... on MediaVideo @alias(as: "video") {
                      uri(width: 512, pixelRatio: $pixelRatio)
                      thumbnail(width: 512)
                    }
                  }
                  ...CoverEditor_coverTemplate
                }
              }
            }
          }
        }
      `,
      key,
    );

  return {
    coverTemplateByType: data?.coverTemplates?.edges?.map(
      edge => edge?.node,
    ) as CoverTemplateTypeListItem[],
    refetch,
    isLoadingPrevious,
    isLoadingNext,
    loadNext,
    hasNext,
  };
}

export type CoverTemplateTypeListItem = NonNullable<
  NonNullable<
    ArrayItemType<
      useCoverTemplates_coverTemplates$data['coverTemplates']['edges']
    >
  >['node']
>;

export type CoverTemplatePreview = NonNullable<
  ArrayItemType<CoverTemplateTypeListItem['data']>
>;
