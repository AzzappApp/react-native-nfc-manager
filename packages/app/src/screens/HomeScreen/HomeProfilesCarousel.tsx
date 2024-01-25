import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import CoverErrorRenderer from '#components/CoverErrorRenderer';
import CoverLink from '#components/CoverLink';
import CoverLoadingIndicator from '#components/CoverLoadingIndicator';
import CoverRenderer from '#components/CoverRenderer';
import Link from '#components/Link';
import { useScreenHasFocus } from '#components/NativeRouter';
import CarouselSelectList from '#ui/CarouselSelectList';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import type {
  HomeProfilesCarousel_user$key,
  HomeProfilesCarousel_user$data,
} from '#relayArtifacts/HomeProfilesCarousel_user.graphql';
import type { HomeProfilesCarouselItem_profile$key } from '#relayArtifacts/HomeProfilesCarouselItem_profile.graphql';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ForwardedRef } from 'react';
import type { GestureResponderEvent, ListRenderItemInfo } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type HomeProfilesCarouselProps = {
  /**
   * The current user
   */
  user: HomeProfilesCarousel_user$key;
  /**
   * The initial profile index to display
   */
  initialProfileIndex?: number;
  /**
   * Callback when the user change the current profile
   */
  onCurrentProfileIndexChange: (index: number) => void;
  /**
   * Animated callback called during the profile switch, index is a floating number
   * the callback passed should be a worklet
   */
  currentProfileIndexSharedValue: SharedValue<number>;
  /**
   * The height of the carousel
   */
  height: number;
};

export type HomeProfilesCarouselHandle = {
  scrollToProfileIndex: (index: number, animated?: boolean) => void;
};

const HomeProfilesCarousel = (
  {
    user: userKey,
    height,
    onCurrentProfileIndexChange,
    currentProfileIndexSharedValue,
    initialProfileIndex = 0,
  }: HomeProfilesCarouselProps,
  ref: ForwardedRef<HomeProfilesCarouselHandle>,
) => {
  const { profiles } = useFragment(
    graphql`
      fragment HomeProfilesCarousel_user on User {
        profiles {
          webCard {
            id
          }
          ...HomeProfilesCarouselItem_profile
        }
      }
    `,
    userKey,
  );

  const { width: windowWidth } = useWindowDimensions();
  const coverHeight = useMemo(() => height - 2 * VERTICAL_MARGIN, [height]);
  const coverWidth = useMemo(
    () => Math.trunc(coverHeight * COVER_RATIO),
    [coverHeight],
    // Platform.OS === 'ios'
    //   ? Math.trunc(coverHeight * COVER_RATIO) //roundToNearestPixel is not working fine on some IOS (i.eiphone 13 mini)
    //   : Math.trunc(coverHeight * COVER_RATIO),
  );
  const carouselRef = useRef<CarouselSelectListHandle | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(
    profiles?.length ? initialProfileIndex + 1 : 0,
  );

  const onSelectedIndexChange = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      onCurrentProfileIndexChange(index - 1);
    },
    [onCurrentProfileIndexChange],
  );

  const scrollToIndex = useCallback((index: number, animated?: boolean) => {
    carouselRef.current?.scrollToIndex(index, animated);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToProfileIndex: index => scrollToIndex(index + 1),
    }),
    [scrollToIndex],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ProfileType | null>) => {
      if (item) {
        return (
          <ItemRender
            item={item}
            coverHeight={coverHeight}
            coverWidth={coverWidth}
            index={index}
            scrollToIndex={scrollToIndex}
            isCurrent={index === selectedIndex}
          />
        );
      }

      return (
        <CreateItemMemo coverHeight={coverHeight} coverWidth={coverWidth} />
      );
    },
    [coverWidth, coverHeight, scrollToIndex, selectedIndex],
  );

  const data = useMemo(
    () => (profiles ? [null, ...profiles] : [null]),
    [profiles],
  );

  const style = useMemo(
    () => [
      styles.carousel,
      {
        width: windowWidth,
        height,
      },
    ],
    [windowWidth, height],
  );

  if (profiles == null) {
    return null;
  }

  return (
    <CarouselSelectList
      ref={carouselRef}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      width={windowWidth}
      height={coverHeight}
      itemWidth={coverWidth}
      scaleRatio={SCALE_RATIO}
      style={style}
      itemContainerStyle={styles.carouselContentContainer}
      onSelectedIndexChange={onSelectedIndexChange}
      currentProfileIndexSharedValue={currentProfileIndexSharedValue}
      initialScrollIndex={
        profiles.length ? initialProfileIndex + 1 : initialProfileIndex
      }
    />
  );
};

const VERTICAL_MARGIN = 15;

const SCALE_RATIO = 108 / 291;

const keyExtractor = (item: ProfileType | null, index: number) =>
  item?.webCard.id ?? `new_${index}`;

export default forwardRef(HomeProfilesCarousel);

type ProfileType = ArrayItemType<HomeProfilesCarousel_user$data['profiles']>;

type ItemRenderProps = {
  index: number;
  item: ProfileType;
  coverWidth: number;
  coverHeight: number;
  scrollToIndex: (index: number) => void;
  isCurrent: boolean;
};

const ItemRenderComponent = ({
  index,
  isCurrent,
  item,
  coverWidth,
  coverHeight,
  scrollToIndex,
}: ItemRenderProps) => {
  const intl = useIntl();

  const profile = useFragment(
    graphql`
      fragment HomeProfilesCarouselItem_profile on Profile {
        id
        invited
        webCard {
          id
          userName
          cardCover {
            media {
              id
            }
          }
          ...CoverLink_webCard
          ...CoverRenderer_webCard
        }
      }
    `,
    item as HomeProfilesCarouselItem_profile$key,
  );

  const [ready, setReady] = useState(!profile?.webCard?.cardCover);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const onReady = useCallback(() => {
    setReady(true);
  }, []);

  const onError = useCallback(() => {
    setReady(false);
    setLoadingFailed(true);
  }, []);

  const onRetry = useCallback(() => {
    setLoadingFailed(false);
    setReady(false);
  }, []);

  const onPress = useCallback(
    (event: GestureResponderEvent) => {
      if (!isCurrent) {
        event.preventDefault();
        scrollToIndex(index);
      }
    },
    [scrollToIndex, isCurrent, index],
  );

  const hasFocus = useScreenHasFocus();

  const containerStyle = useMemo(
    () => [
      styles.coverShadow,
      styles.coverContainer,
      {
        width: coverWidth,
        height: coverHeight,
        borderRadius: coverWidth * COVER_CARD_RADIUS,
      },
    ],
    [coverWidth, coverHeight],
  );

  return (
    <View style={containerStyle}>
      {loadingFailed ? (
        <CoverErrorRenderer
          label={
            <FormattedMessage
              defaultMessage="An error occured"
              description="Error message displayed when a cover failed to load in HomeScreen"
            />
          }
          width={coverWidth}
          onRetry={onRetry}
        />
      ) : profile.invited ? (
        <View
          style={{
            width: coverWidth,
            aspectRatio: 0.625,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: coverWidth * COVER_CARD_RADIUS,
            backgroundColor: colors.white,
          }}
        >
          <Icon
            icon="shared_webcard"
            style={styles.invitationIcon}
            tintColor={colors.red400}
          />
        </View>
      ) : profile.webCard.cardCover?.media?.id != null ? (
        <CoverLink
          webCard={profile.webCard}
          width={coverWidth}
          webCardId={profile.webCard.id}
          onPress={onPress}
          animationEnabled={isCurrent && hasFocus}
          onReadyForDisplay={onReady}
          onError={onError}
        />
      ) : (
        <Link
          route="NEW_WEBCARD"
          params={{
            webCardId: profile.webCard.id,
          }}
        >
          <PressableOpacity
            style={[
              {
                width: coverWidth,
                height: coverHeight,
                borderRadius: coverWidth * COVER_CARD_RADIUS,
                overflow: 'visible',
              },
            ]}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Create a new profile',
              description: 'Start new profile creation from account screen',
            })}
          >
            <CoverRenderer
              width={coverWidth}
              webCard={profile.webCard}
              onReadyForDisplay={onReady}
              onError={onError}
            />
          </PressableOpacity>
        </Link>
      )}
      {!ready && !profile.invited && !loadingFailed && (
        <CoverLoadingIndicator
          width={coverWidth}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
};

const ItemRender = memo(ItemRenderComponent);

const CreateItem = ({
  coverWidth,
  coverHeight,
}: {
  coverWidth: number;
  coverHeight: number;
}) => {
  const intl = useIntl();
  return (
    <Link route="NEW_WEBCARD">
      <PressableOpacity
        style={[
          styles.newCover,
          styles.coverShadow,
          {
            width: coverWidth,
            height: coverHeight,
            borderRadius: coverWidth * COVER_CARD_RADIUS,
          },
        ]}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Create a new profile',
          description: 'Start new profile creation from account screen',
        })}
      >
        <Icon icon="add" style={styles.icon} />
      </PressableOpacity>
    </Link>
  );
};

const CreateItemMemo = memo(CreateItem);

const styles = StyleSheet.create({
  carousel: {
    flexGrow: 0,
    overflow: 'visible',
    alignSelf: 'center',
    paddingVertical: VERTICAL_MARGIN,
  },
  carouselContentContainer: {
    flexGrow: 0,
    overflow: 'visible',
  },
  coverShadow: shadow('light', 'bottom'),
  newCover: {
    aspectRatio: COVER_RATIO,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'visible',
  },
  icon: {
    tintColor: colors.white,
    width: 44,
    height: 44,
  },
  invitationIcon: { width: 60, height: 60 },
  coverContainer: {
    overflow: 'visible',
    // trick to have the shadow on the cover
  },
});
