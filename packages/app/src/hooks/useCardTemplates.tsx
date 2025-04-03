import { fromGlobalId } from 'graphql-relay';
import { useCallback, useMemo, useState } from 'react';
import { graphql, useLazyLoadQuery, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import type { CardTemplateItem } from '#components/CardTemplateList';
import type { useCardTemplates_cardTemplates$key } from '#relayArtifacts/useCardTemplates_cardTemplates.graphql';
import type { useCardTemplatesQuery } from '#relayArtifacts/useCardTemplatesQuery.graphql';

const useCardTemplates = (profileId: string, search = '') => {
  const [selectedCardTemplateType, setSelectedCardTemplateType] = useState<
    { id: string; title: string } | undefined
  >(undefined);

  const { node } = useLazyLoadQuery<useCardTemplatesQuery>(
    graphql`
      query useCardTemplatesQuery($profileId: ID!) {
        node(id: $profileId) {
          ... on Profile @alias(as: "profile") {
            ...useCardTemplates_cardTemplates
            cardTemplateTypes {
              id
              label
            }
          }
        }
      }
    `,
    { profileId },
  );

  const profile = node?.profile;
  const cardTemplateTypes = node?.profile?.cardTemplateTypes;

  const templateTypes = useMemo(() => {
    return (
      cardTemplateTypes?.reduce(
        (
          acc: Array<{
            title: string;
            data: [
              {
                id: string;
                title: string;
                data: Array<{ id: string; title: string } | null>;
              },
            ];
          }>,
          curr,
        ) => {
          if (!curr) {
            return acc;
          }
          const label = curr?.label ?? '-';

          const existingSection = acc.find(section => section.title === label);

          if (existingSection) {
            if (
              !search.trim() ||
              curr.label?.toLowerCase().includes(search.trim().toLowerCase())
            ) {
              existingSection.data.push({
                id: curr.id,
                title: curr.label ?? '-',
                data: [],
              });

              existingSection.data = existingSection.data.sort((a, b) =>
                a.title.localeCompare(b.title),
              );
            }
          } else if (
            !search.trim() ||
            curr.label?.toLowerCase().includes(search.trim().toLowerCase())
          ) {
            acc.push({
              title: label,
              data: [{ id: curr.id, title: curr.label ?? '-', data: [] }],
            });
          }

          return acc;
        },
        [],
      ) ?? []
    ).sort((a, b) => a.title.localeCompare(b.title));
  }, [cardTemplateTypes, search]);

  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment useCardTemplates_cardTemplates on Profile
        @refetchable(queryName: "useCardTemplates_cardTemplates_Query")
        @argumentDefinitions(
          cardTemplateTypeId: { type: String, defaultValue: null }
          after: { type: String }
          first: { type: Int, defaultValue: 20 }
        ) {
          cardTemplates(
            cardTemplateTypeId: $cardTemplateTypeId
            first: $first
            after: $after
          ) @connection(key: "useCardTemplates_connection_cardTemplates") {
            edges {
              node {
                id
                label
                previewMedia {
                  uri(width: 1024)
                  aspectRatio
                }
                cardStyle {
                  borderColor
                  borderRadius
                  borderWidth
                  buttonColor
                  fontFamily
                  fontSize
                  gap
                  titleFontFamily
                  titleFontSize
                  buttonRadius
                }
                cardTemplateType {
                  id
                  label
                }
                modules {
                  kind
                  ...ModuleData_cardModules
                }
              }
            }
          }
        }
      `,
      profile as useCardTemplates_cardTemplates$key | null,
    );

  const onSelectSection = useCallback(
    (item: { id: string; title: string }) => {
      setSelectedCardTemplateType(item);
      refetch(
        { cardTemplateTypeId: fromGlobalId(item.id).id, after: null },
        { fetchPolicy: 'store-and-network' },
      );
    },
    [refetch],
  );

  const templates = useMemo<CardTemplateItem[]>(
    () =>
      convertToNonNullArray(
        data?.cardTemplates?.edges?.map(edge => {
          if (!edge?.node || !profile) {
            return null;
          }
          const {
            id,
            previewMedia,
            label,
            cardStyle,
            modules,
            cardTemplateType,
          } = edge.node;
          return {
            id,
            previewMedia,
            label,
            cardStyle,
            modules,
            cardTemplateType,
          };
        }) ?? [],
      ).sort((a, b) => (a.label ?? '').localeCompare(b.label ?? '')),
    [data?.cardTemplates?.edges, profile],
  );

  const loadMore = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  return [
    templateTypes,
    selectedCardTemplateType,
    templates,
    onSelectSection,
    loadMore,
  ] as const;
};

export default useCardTemplates;
