import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import EmptyContent from '#components/ui/EmptyContent';
import WebCardList from '#components/WebCardList';
import { getAuthState } from '#helpers/authStore';
import { profileInfoHasEditorRight } from '#helpers/profileRoleHelper';
import useToggleFollow from '#hooks/useToggleFollow';
import type { FollowingsScreenList_webCard$key } from '#relayArtifacts/FollowingsScreenList_webCard.graphql';

type FollowingsListProps = {
  webCard: FollowingsScreenList_webCard$key | null;
  searchValue: string | undefined;
};

const FollowingsScreenList = ({
  searchValue,
  webCard: webCardKey,
}: FollowingsListProps) => {
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment FollowingsScreenList_webCard on WebCard
        @refetchable(queryName: "FollowingsListScreenQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 50 }
          userName: { type: String, defaultValue: "" }
        ) {
          followings(after: $after, first: $first, userName: $userName)
            @connection(key: "Account_followings") {
            edges {
              node {
                ...WebCardList_webCard
              }
            }
          }
        }
      `,
      webCardKey,
    );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext && !isRefreshing) {
      loadNext(50);
    }
  }, [isLoadingNext, hasNext, isRefreshing, loadNext]);

  const intl = useIntl();

  const [debouncedSearch] = useDebounce(searchValue, 300);

  const toggleFollow = useToggleFollow(debouncedSearch);

  useEffect(() => {
    // We need to refetch to see new coming followers (specially when we follow another webCard we have)
    refetch(
      { first: 50, after: null },
      {
        fetchPolicy: 'store-and-network',
      },
    );
  }, [refetch]);

  useEffect(() => {
    if (debouncedSearch) {
      setIsRefreshing(true);
      const { dispose } = refetch(
        { first: 50, userName: debouncedSearch, after: null },
        {
          fetchPolicy: 'store-and-network',
          onComplete() {
            setIsRefreshing(false);
          },
        },
      );
      return dispose;
    }
  }, [debouncedSearch, refetch]);

  const onToggleFollow = useCallback(
    (profileId: string, profileUserName: string) => {
      const { profileInfos } = getAuthState();
      if (profileInfoHasEditorRight(profileInfos)) {
        toggleFollow(profileId, profileUserName, false);
      } else {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Your role does not permit this action',
            description:
              'Error message when trying to unfollow a WebCard without being an admin',
          }),
        });
      }
    },
    [intl, toggleFollow],
  );

  return (
    <WebCardList
      users={convertToNonNullArray(
        data?.followings?.edges?.map(edge => edge?.node) ?? [],
      )}
      onEndReached={onEndReached}
      onToggleFollow={onToggleFollow}
      ListEmptyComponent={<FollowingScreenListEmpty />}
    />
  );
};

const FollowingScreenListEmpty = () => {
  return (
    <View style={styles.emptyScreenContainer}>
      <EmptyContent
        message={
          <FormattedMessage
            defaultMessage="No contact yet"
            description="Empty following message title"
          />
        }
        description={
          <FormattedMessage
            defaultMessage="Seems like you are not following anyone yet..."
            description="Empty following list message content"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FollowingsScreenList;
