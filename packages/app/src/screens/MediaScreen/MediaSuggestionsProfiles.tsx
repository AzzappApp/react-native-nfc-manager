import {
  useMemo,
  useCallback,
  startTransition,
  useEffect,
  useRef,
  Suspense,
} from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import CoverLink_profileFragment from '@azzapp/relay/artifacts/CoverLink_profile.graphql';

import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { colors, shadow } from '#theme';
import CoverLink from '#components/CoverLink';
import CoverList from '#components/CoverList';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useToggleFollow from '#hooks/useToggleFollow';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import type { CoverLinkProps } from '#components/CoverLink';
import type { MediaSuggestionsProfiles_viewer$key } from '@azzapp/relay/artifacts/MediaSuggestionsProfiles_viewer.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type MediaSuggestionsProfilesProps = {
  viewer: MediaSuggestionsProfiles_viewer$key;
  coverListStyle?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
  isCurrentTab: boolean;
};

const NB_PROFILES = 6;

const MediaSuggestionsProfiles = ({
  viewer,
  coverListStyle,
  header,
  isCurrentTab,
}: MediaSuggestionsProfilesProps) => (
  <View>
    {header}
    <Suspense
      fallback={
        <View
          style={[
            { height: 260, alignItems: 'center', justifyContent: 'center' },
            coverListStyle,
          ]}
        >
          <ActivityIndicator />
        </View>
      }
    >
      <MediaSuggestionsProfilesInner
        viewer={viewer}
        style={coverListStyle}
        isCurrentTab={isCurrentTab}
      />
    </Suspense>
  </View>
);

const MediaSuggestionsProfilesInner = ({
  viewer,
  style,
  isCurrentTab,
}: {
  viewer: MediaSuggestionsProfiles_viewer$key;
  style?: StyleProp<ViewStyle>;
  isCurrentTab: boolean;
}) => {
  const { data, refetch, loadNext, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment MediaSuggestionsProfiles_viewer on Viewer
        @refetchable(queryName: "MediaSuggestionsProfilesListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 6 }
        ) {
          profile {
            id
          }
          recommendedProfiles(after: $after, first: $first)
            @connection(key: "Viewer_recommendedProfiles") {
            edges {
              node {
                id
                ...CoverList_users
                isFollowing
              }
            }
          }
        }
      `,
      viewer,
    );

  const isCurrentTabRef = useRef(isCurrentTab);
  useEffect(() => {
    console.log('isCurrentTabRef', isCurrentTabRef.current, isCurrentTab);
    if (isCurrentTab && !isCurrentTabRef.current) {
      startTransition(() => {
        refetch(
          {
            first: NB_PROFILES,
            after: null,
          },
          { fetchPolicy: 'store-and-network' },
        );
      });
    }
    isCurrentTabRef.current = isCurrentTab;
  }, [isCurrentTab, refetch]);

  const users = useMemo(() => {
    return convertToNonNullArray(
      data.recommendedProfiles?.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data.recommendedProfiles?.edges]);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(NB_PROFILES);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  const followingMap = useMemo(() => {
    return new Map<string, boolean>(
      users.map(user => [user.id, user.isFollowing]),
    );
  }, [users]);

  const styles = useStyleSheet(styleSheet);

  return (
    <CoverList
      users={users}
      onEndReached={onEndReached}
      containerStyle={styles.containerStyle}
      initialNumToRender={NB_PROFILES}
      style={style}
      renderItem={({ item }) => (
        <CoverLinkWithOptions
          profile={item}
          isFollowing={followingMap.get(item.id) ?? false}
          profileId={item.id}
        />
      )}
    />
  );
};

const CoverLinkWithOptions = ({
  isFollowing,
  ...props
}: CoverLinkProps & { isFollowing: boolean }) => {
  const styles = useStyleSheet(styleSheet);

  const toggleFollow = useToggleFollow();

  const { userName } = useFragment(CoverLink_profileFragment, props.profile);

  const intl = useIntl();

  return (
    <Animated.View style={styles.coverContainerStyle} exiting={FadeOut}>
      <CoverLink {...props} width={135} />
      <View style={styles.bottomActions}>
        <Button
          variant={isFollowing ? 'little_round_inverted' : 'little_round'}
          label={
            isFollowing
              ? intl.formatMessage({
                  defaultMessage: 'Unfollow',
                  description: 'Unfollow button label in profile suggestions',
                })
              : intl.formatMessage({
                  defaultMessage: 'Follow',
                  description: 'Follow button label in profile suggestions',
                })
          }
          style={{ flex: 1 }}
          onPress={() => {
            startTransition(() => {
              toggleFollow(props.profileId, userName, !isFollowing);
            });
          }}
        />
      </View>
    </Animated.View>
  );
};

export default MediaSuggestionsProfiles;

const styleSheet = createStyleSheet(appearance => ({
  containerStyle: {
    paddingHorizontal: 8,
    overflow: 'visible',
    zIndex: 1,
    gap: 10,
  },
  coverContainerStyle: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    padding: 5,
    gap: 5,
    borderRadius: 15,
    ...shadow(appearance, 'bottom'),
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 5,
    width: '100%',
    alignItems: 'center',
  },
  followButton: {},
}));
