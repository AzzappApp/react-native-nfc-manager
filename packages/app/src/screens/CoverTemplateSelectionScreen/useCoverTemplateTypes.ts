import { useMemo } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import {
  convertToNonNullArray,
  type ArrayItemType,
} from '@azzapp/shared/arrayHelpers';
import type {
  useCoverTemplateTypes_coverTemplates$key,
  useCoverTemplateTypes_coverTemplates$data,
} from '#relayArtifacts/useCoverTemplateTypes_coverTemplates.graphql';
import type { RefetchFnDynamic } from 'react-relay';
import type { OperationType } from 'relay-runtime';

type UseCoverTemplatesReturnType = {
  coverTemplateTypes: CoverTemplateType[];
  refetch: RefetchFnDynamic<
    OperationType,
    useCoverTemplateTypes_coverTemplates$key
  >;
  isLoadingPrevious: boolean;
  isLoadingNext: boolean;
  loadNext: (nbItems: number) => void;
  hasNext: boolean;
};

export function useCoverTemplateTypes(
  key: useCoverTemplateTypes_coverTemplates$key | null,
): UseCoverTemplatesReturnType {
  const { data, refetch, isLoadingPrevious, isLoadingNext, loadNext, hasNext } =
    usePaginationFragment(
      graphql`
        fragment useCoverTemplateTypes_coverTemplates on WebCard
        @refetchable(queryName: "useCoverTemplates_coverTemplateTypes_Query")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 5 }
          tagId: { type: ID, defaultValue: null }
        ) {
          coverTemplateTypes(tagId: $tagId, first: $first, after: $after)
            @connection(
              key: "useCoverTemplates_connection_coverTemplateTypes"
            ) {
            edges {
              node {
                id
                order
                label
                coverTemplates {
                  # eslint-disable-next-line relay/must-colocate-fragment-spreads
                  ...CoverTemplateTypePreviews_coverTemplate
                }
              }
            }
          }
        }
      `,
      key,
    );

  const templateTypes = useMemo(() => {
    if (data?.coverTemplateTypes?.edges) {
      return convertToNonNullArray(
        data?.coverTemplateTypes?.edges
          .filter(a => a?.node != null)
          .map(a => a!.node),
      );
    }
    return [];
  }, [data?.coverTemplateTypes]);

  return {
    coverTemplateTypes: templateTypes,
    refetch,
    isLoadingPrevious,
    isLoadingNext,
    loadNext,
    hasNext,
  };
}

export type CoverTemplateType = NonNullable<
  NonNullable<
    ArrayItemType<
      useCoverTemplateTypes_coverTemplates$data['coverTemplateTypes']['edges']
    >
  >['node']
>;
