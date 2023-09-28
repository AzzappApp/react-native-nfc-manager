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
import Animated from 'react-native-reanimated';
import {
  commitLocalUpdate,
  graphql,
  useFragment,
  usePaginationFragment,
  useRelayEnvironment,
} from 'react-relay';
import CoverLink_profileFragment from '@azzapp/relay/artifacts/CoverLink_profile.graphql';

import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { colors, shadow } from '#theme';
import CoverLink from '#components/CoverLink';
import CoverList from '#components/CoverList';
import { useScreenHasFocus } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useToggleFollow from '#hooks/useToggleFollow';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import IconButton from '#ui/IconButton';
import type { CoverLinkProps } from '#components/CoverLink';
import type { MediaSuggestionsProfiles_viewer$key } from '@azzapp/relay/artifacts/MediaSuggestionsProfiles_viewer.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type MediaSuggestionsProfilesProps = {
  viewer: MediaSuggestionsProfiles_viewer$key;
  coverListStyle?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
};

const NB_PROFILES = 6;

const MediaSuggestionsProfiles = ({
  viewer,
  coverListStyle,
  header,
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
      <MediaSuggestionsProfilesInner viewer={viewer} style={coverListStyle} />
    </Suspense>
  </View>
);

const MediaSuggestionsProfilesInner = ({
  viewer,
  style,
}: {
  viewer: MediaSuggestionsProfiles_viewer$key;
  style?: StyleProp<ViewStyle>;
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

  const hasFocus = useScreenHasFocus();
  const hasFocusRef = useRef(hasFocus);
  useEffect(() => {
    if (hasFocus && !hasFocusRef.current) {
      startTransition(() => {
        refetch(
          {
            first: NB_PROFILES,
            after: null,
          },
          { fetchPolicy: 'store-only' },
        );
      });
    }
    hasFocusRef.current = hasFocus;
  }, [hasFocus, refetch]);

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
          viewerProfileID={data.profile?.id}
        />
      )}
    />
  );
};

const CoverLinkWithOptions = ({
  viewerProfileID,
  isFollowing,
  ...props
}: CoverLinkProps & { viewerProfileID?: string; isFollowing: boolean }) => {
  const styles = useStyleSheet(styleSheet);

  const toggleFollow = useToggleFollow(viewerProfileID);

  const { userName } = useFragment(CoverLink_profileFragment, props.profile);

  const environment = useRelayEnvironment();

  const intl = useIntl();

  return (
    // TODO reenable once RANIMATED3 see: https://github.com/software-mansion/react-native-reanimated/issues/3124
    <Animated.View style={styles.coverContainerStyle} /*exiting={FadeOut}*/>
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
        <IconButton
          icon="close"
          size={29}
          onPress={() => {
            //TODO: implement real update in database
            commitLocalUpdate(environment, store => {
              store.getRoot().getLinkedRecord('viewer');
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
