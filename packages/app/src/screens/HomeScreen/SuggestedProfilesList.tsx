import { useCallback, useMemo } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import CoverList from '#components/CoverList';
import { useFocusEffect } from '#hooks/useFocusEffect';
import type { CoverList_users$key } from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { HomeProfilesList_viewer$data } from '@azzapp/relay/artifacts/HomeProfilesList_viewer.graphql';
import type { SuggestedProfilesList_viewer$key } from '@azzapp/relay/artifacts/SuggestedProfilesList_viewer.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type FollowedProfilesListProps = {
  viewer: SuggestedProfilesList_viewer$key;
  style?: StyleProp<ViewStyle>;
  profile: HomeProfilesList_viewer$data['profile'];
  ListHeaderComponent: React.ComponentType<any> | React.ReactElement | null;
  onReady?: () => void;
};

const SuggestedProfilesList = ({
  viewer,
  profile,
  style,
  ListHeaderComponent,
  onReady,
}: FollowedProfilesListProps) => {
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment SuggestedProfilesList_viewer on Viewer
        @refetchable(queryName: "SuggestedProfilesListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
        ) {
          suggestedProfiles(after: $after, first: $first)
            @connection(key: "SuggestedProfilesList_suggestedProfiles") {
            edges {
              node {
                ...CoverList_users
              }
            }
          }
        }
      `,
      viewer,
    );

  useFocusEffect(
    useCallback(() => {
      refetch({}, { fetchPolicy: 'store-or-network' });
    }, [refetch]),
  );

  const users: CoverList_users$key = useMemo(() => {
    const recommendedUsers = data.suggestedProfiles.edges
      ?.map(edge => edge?.node)
      .filter(item => !!item);
    return convertToNonNullArray(
      profile?.card?.id
        ? [profile, ...(recommendedUsers ?? [])]
        : recommendedUsers ?? [],
    );
  }, [profile, data.suggestedProfiles.edges]);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  return (
    <CoverList
      users={users}
      onEndReached={onEndReached}
      style={style}
      ListHeaderComponent={ListHeaderComponent}
      onReady={onReady}
    />
  );
};

export default SuggestedProfilesList;
