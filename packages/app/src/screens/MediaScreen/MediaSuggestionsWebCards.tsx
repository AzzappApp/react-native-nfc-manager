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
import Toast from 'react-native-toast-message';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { colors, shadow } from '#theme';
import CoverLink from '#components/CoverLink';
import CoverList from '#components/CoverList';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAuthState from '#hooks/useAuthState';
import useToggleFollow from '#hooks/useToggleFollow';
import CoverLink_webCardFragment from '#relayArtifacts/CoverLink_webCard.graphql';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import type { CoverLinkProps } from '#components/CoverLink';
import type { MediaSuggestionsWebCards_profile$key } from '#relayArtifacts/MediaSuggestionsWebCards_profile.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type MediaSuggestionsWebCardsProps = {
  profile: MediaSuggestionsWebCards_profile$key;
  coverListStyle?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
  isCurrentTab: boolean;
};

const NB_PROFILES = 6;

const MediaSuggestionsWebCards = ({
  profile,
  coverListStyle,
  header,
  isCurrentTab,
}: MediaSuggestionsWebCardsProps) => (
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
      <MediaSuggestionsWebCardsInner
        profile={profile}
        style={coverListStyle}
        isCurrentTab={isCurrentTab}
      />
    </Suspense>
  </View>
);

const MediaSuggestionsWebCardsInner = ({
  profile,
  style,
  isCurrentTab,
}: {
  profile: MediaSuggestionsWebCards_profile$key;
  style?: StyleProp<ViewStyle>;
  isCurrentTab: boolean;
}) => {
  const { data, refetch, loadNext, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment MediaSuggestionsWebCards_profile on Profile
        @refetchable(queryName: "MediaSuggestionsWebCardsListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 6 }
        ) {
          recommendedWebCards(after: $after, first: $first)
            @connection(key: "Viewer_recommendedWebCards") {
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
      profile,
    );

  const isCurrentTabRef = useRef(isCurrentTab);
  useEffect(() => {
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
      data.recommendedWebCards?.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data.recommendedWebCards?.edges]);

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
          webCard={item}
          isFollowing={followingMap.get(item.id) ?? false}
          webCardId={item.id}
        />
      )}
    />
  );
};

const CoverLinkWithOptions = ({
  isFollowing,
  ...props
}: CoverLinkProps & {
  isFollowing: boolean;
}) => {
  const styles = useStyleSheet(styleSheet);

  const { profileInfos } = useAuthState();

  const toggleFollow = useToggleFollow();

  const { userName } = useFragment(CoverLink_webCardFragment, props.webCard);

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
            if (isEditor(profileInfos?.profileRole)) {
              startTransition(() => {
                toggleFollow(props.webCardId, userName, !isFollowing);
              });
            } else if (isFollowing) {
              Toast.show({
                type: 'error',
                text1: intl.formatMessage({
                  defaultMessage:
                    'Only admins & editors can stop following a WebCard',
                  description:
                    'Error message when trying to unfollow a WebCard without being an admin',
                }),
              });
            } else {
              Toast.show({
                type: 'error',
                text1: intl.formatMessage({
                  defaultMessage: 'Only admins & editors can follow a WebCard',
                  description:
                    'Error message when trying to follow a WebCard without being an admin',
                }),
              });
            }
          }}
        />
      </View>
    </Animated.View>
  );
};

export default MediaSuggestionsWebCards;

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
