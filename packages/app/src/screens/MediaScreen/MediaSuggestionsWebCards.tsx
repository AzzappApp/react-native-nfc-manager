import range from 'lodash/range';
import {
  useMemo,
  useCallback,
  startTransition,
  useEffect,
  useRef,
} from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { profileHasEditorRight } from '@azzapp/shared/profileHelpers';
import { colors, shadow } from '#theme';
import CoverLink from '#components/CoverLink';
import CoverList from '#components/CoverList';
import Skeleton from '#components/Skeleton';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAuthState from '#hooks/useAuthState';
import useToggleFollow from '#hooks/useToggleFollow';
import CoverLink_webCardFragment from '#relayArtifacts/CoverLink_webCard.graphql';
import Button from '#ui/Button';
import type { CoverLinkProps } from '#components/CoverLink';
import type { MediaSuggestionsWebCards_profile$key } from '#relayArtifacts/MediaSuggestionsWebCards_profile.graphql';
import type { MediaSuggestionsWebCards_webCard$key } from '#relayArtifacts/MediaSuggestionsWebCards_webCard.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type MediaSuggestionsWebCardsProps = {
  profile: MediaSuggestionsWebCards_profile$key;
  webCard: MediaSuggestionsWebCards_webCard$key | null;
  isCurrentTab: boolean;
  style?: StyleProp<ViewStyle>;
};

const NB_PROFILES = 6;

const MediaSuggestionsWebCards = ({
  profile,
  webCard,
  isCurrentTab,
  style,
}: MediaSuggestionsWebCardsProps) => {
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

  const { cardIsPublished } = useFragment(
    graphql`
      fragment MediaSuggestionsWebCards_webCard on WebCard {
        cardIsPublished
      }
    `,
    webCard,
  ) ?? { cardIsPublished: false };

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
          cardIsPublished={cardIsPublished}
        />
      )}
    />
  );
};

const CoverLinkWithOptions = ({
  isFollowing,
  cardIsPublished,
  ...props
}: CoverLinkProps & {
  isFollowing: boolean;
  cardIsPublished: boolean;
}) => {
  const styles = useStyleSheet(styleSheet);

  const { profileInfos } = useAuthState();

  const toggleFollow = useToggleFollow();

  const { userName } = useFragment(CoverLink_webCardFragment, props.webCard);

  const intl = useIntl();

  const onPress = useCallback(() => {
    if (!cardIsPublished) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage:
            'This action can only be done from a published WebCard.',
          description:
            'MediaSuggestionsWebCards - AlertMessage when the user is viewing a post with an unpublished WebCard',
        }),
      });
      return;
    }

    if (profileHasEditorRight(profileInfos?.profileRole)) {
      startTransition(() => {
        toggleFollow(props.webCardId, userName, !isFollowing);
      });
    } else if (isFollowing) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description:
            'Error message when trying to unfollow a WebCard without being an admin',
        }),
      });
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description:
            'Error message when trying to follow a WebCard without being an admin',
        }),
      });
    }
  }, [
    cardIsPublished,
    intl,
    isFollowing,
    profileInfos?.profileRole,
    props.webCardId,
    toggleFollow,
    userName,
  ]);

  return (
    <Animated.View style={styles.coverContainerStyle} exiting={FadeOut}>
      <CoverLink {...props} width={COVER_SUGGESTIONS_WIDTH} />
      <View style={styles.bottomActions}>
        <FollowButton isFollowing={isFollowing} onPress={onPress} />
      </View>
    </Animated.View>
  );
};
type FollowButtonProps = {
  onPress?: () => void;
  isFollowing: boolean;
  disabled?: boolean;
};

const FollowButton = ({
  onPress,
  isFollowing,
  disabled,
}: FollowButtonProps) => {
  const intl = useIntl();
  return (
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
      disabled={disabled}
      style={{ flex: 1 }}
      onPress={onPress}
    />
  );
};

export default MediaSuggestionsWebCards;

export const MediaSuggestionWebCardFallback = () => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View style={[styles.containerStyle, { flexDirection: 'row' }]}>
      {range(0, 4).map(index => (
        <View key={index} style={styles.coverContainerStyle}>
          <Skeleton style={styles.coverContainerFallback} key={index} />
          <View style={styles.bottomActions}>
            <FollowButton isFollowing={false} disabled />
          </View>
        </View>
      ))}
    </View>
  );
};

export const COVER_SUGGESTIONS_WIDTH = 135;
export const COVER_SUGGESTIONS_PADDING = 5;

const styleSheet = createStyleSheet(appearance => ({
  containerStyle: {
    paddingHorizontal: 8,
    overflow: 'visible',
    zIndex: 1,
    paddingBottom: 20,
    paddingTop: 16.5,
    gap: 10,
  },
  coverContainerStyle: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    padding: COVER_SUGGESTIONS_PADDING,
    gap: COVER_SUGGESTIONS_PADDING,
    borderRadius: 15,
    ...shadow(appearance, 'bottom'),
  },
  coverContainerFallback: {
    width: COVER_SUGGESTIONS_WIDTH,
    borderRadius: COVER_SUGGESTIONS_WIDTH * COVER_CARD_RADIUS,
    aspectRatio: COVER_RATIO,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 5,
    width: '100%',
    alignItems: 'center',
  },
  followButton: {},
}));
