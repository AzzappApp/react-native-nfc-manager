import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import ProfileList from '#components/ProfileList';
import useToggleFollow from '#hooks/useToggleFollow';
import type { FollowedProfilesScreenList_viewer$key } from '@azzapp/relay/artifacts/FollowedProfilesScreenList_viewer.graphql';

type FollowedProfilesListProps = {
  currentProfileId: string;
  viewer: FollowedProfilesScreenList_viewer$key;
};

const FollowedProfilesScreenList = ({
  currentProfileId,
  viewer: viewerKey,
}: FollowedProfilesListProps) => {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    graphql`
      fragment FollowedProfilesScreenList_viewer on Viewer
      @refetchable(queryName: "FollowedProfilesListScreenQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 10 }
      ) {
        followedProfiles(after: $after, first: $first)
          @connection(key: "Account_followedProfiles") {
          edges {
            node {
              ...ProfileList_users
            }
          }
        }
      }
    `,
    viewerKey,
  );

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  const toggleFollow = useToggleFollow(currentProfileId);

  const intl = useIntl();

  return (
    data.followedProfiles?.edges && (
      <ProfileList
        noProfileFoundLabel={intl.formatMessage({
          defaultMessage: 'Not following anyone',
          description:
            'Message displayed in the followed profiles screen when the user is not following anyone',
        })}
        users={convertToNonNullArray(
          data.followedProfiles.edges?.map(edge => edge?.node),
        )}
        onEndReached={onEndReached}
        onToggleFollow={(profileId: string) => toggleFollow(profileId, false)}
      />
    )
  );
};

export default FollowedProfilesScreenList;
