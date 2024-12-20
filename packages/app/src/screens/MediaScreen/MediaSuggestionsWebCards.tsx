import * as Sentry from '@sentry/react-native';
import range from 'lodash/range';
import {
  useMemo,
  useCallback,
  startTransition,
  useEffect,
  useRef,
  memo,
} from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import CoverLink from '#components/CoverLink';
import CoverList from '#components/CoverList';
import Skeleton from '#components/Skeleton';
import { getAuthState } from '#helpers/authStore';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { profileInfoHasEditorRight } from '#helpers/profileRoleHelper';
import useToggleFollow from '#hooks/useToggleFollow';
import CoverLink_webCardFragment from '#relayArtifacts/CoverLink_webCard.graphql';
import Button from '#ui/Button';
import type { CoverLinkProps } from '#components/CoverLink';
import type { CoverList_users$data } from '#relayArtifacts/CoverList_users.graphql';
import type { MediaSuggestionsWebCards_profile$key } from '#relayArtifacts/MediaSuggestionsWebCards_profile.graphql';
import type { MediaSuggestionsWebCards_webCard$key } from '#relayArtifacts/MediaSuggestionsWebCards_webCard.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo } from '@shopify/flash-list';

type MediaSuggestionsWebCardsProps = {
  profile: MediaSuggestionsWebCards_profile$key;
  webCard: MediaSuggestionsWebCards_webCard$key | null;
  isCurrentTab: boolean;
  canPlay: boolean;
};

const NB_PROFILES = 12;

const MediaSuggestionsWebCards = ({
  profile,
  webCard,
  isCurrentTab,
  canPlay,
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

  const renderItem = useCallback(
    ({
      item,
      index,
      extraData,
    }: ListRenderItemInfo<ArrayItemType<CoverList_users$data>>) => {
      const shouldPlay =
        extraData.canPlay &&
        extraData.viewableItems.some((v: any) => v === index);

      return (
        <CoverLinkWithOptions
          webCard={item}
          isFollowing={extraData.followingMap.get(item.id) ?? false}
          webCardId={item.id}
          cardIsPublished={extraData.cardIsPublished}
          canPlay={shouldPlay}
        />
      );
    },
    [],
  );

  const extraData = useMemo(
    () => ({ followingMap, cardIsPublished, canPlay }),
    [canPlay, cardIsPublished, followingMap],
  );

  return (
    <View style={styles.containerStyle}>
      <CoverList
        users={users}
        onEndReached={onEndReached}
        renderItem={renderItem}
        coverWidth={COVER_SUGGESTIONS_WIDTH + 2 * COVER_SUGGESTIONS_PADDING}
        extraData={extraData}
      />
    </View>
  );
};

const CoverLinkWithOptionsItem = ({
  isFollowing,
  cardIsPublished,
  ...props
}: CoverLinkProps & {
  isFollowing: boolean;
  cardIsPublished: boolean;
}) => {
  const styles = useStyleSheet(styleSheet);

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

    const { profileInfos } = getAuthState();

    if (profileInfoHasEditorRight(profileInfos)) {
      if (!userName) {
        Sentry.captureMessage(
          'null username in MediaSuggesionsWebCards / onPress',
        );
      } else {
        startTransition(() => {
          toggleFollow(props.webCardId, userName, !isFollowing);
        });
      }
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

const CoverLinkWithOptions = memo(CoverLinkWithOptionsItem);

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
    <View style={[styles.containerStyle, styles.suggestionContainer]}>
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
const ACTION_BUTTON_HEIGHT = 29;

const styleSheet = createStyleSheet(appearance => ({
  containerStyle: {
    overflow: 'visible',
    zIndex: 1,
    paddingBottom: 20,
    paddingTop: 16.5,
  },
  coverContainerStyle: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    padding: COVER_SUGGESTIONS_PADDING,
    gap: COVER_SUGGESTIONS_PADDING,
    borderRadius: 18,
    overFlow: 'visible',
    width: COVER_SUGGESTIONS_WIDTH + 2 * COVER_SUGGESTIONS_PADDING,
    height:
      COVER_SUGGESTIONS_WIDTH / COVER_RATIO +
      2 * COVER_SUGGESTIONS_PADDING +
      2 * COVER_SUGGESTIONS_PADDING +
      ACTION_BUTTON_HEIGHT, //required for android
    ...shadow(appearance, 'bottom'),
  },
  coverContainerFallback: {
    width: COVER_SUGGESTIONS_WIDTH,
    borderRadius: COVER_SUGGESTIONS_WIDTH * COVER_CARD_RADIUS,
    aspectRatio: COVER_RATIO,
  },
  bottomActions: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    height: ACTION_BUTTON_HEIGHT, //fix on android
  },
  followButton: {},
  suggestionContainer: { flexDirection: 'row', paddingLeft: 10, gap: 10 },
}));
