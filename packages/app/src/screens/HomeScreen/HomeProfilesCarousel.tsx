import { BlurView } from 'expo-blur';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  PixelRatio,
  Dimensions,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { colors, shadow } from '#theme';
import CoverErrorRenderer from '#components/CoverErrorRenderer';
import CoverLink from '#components/CoverLink';
import CoverLoadingIndicator from '#components/CoverLoadingIndicator';
import CoverRenderer from '#components/CoverRenderer';
import Link from '#components/Link';
import {
  useOnFocus,
  useRouter,
  useScreenHasFocus,
} from '#components/NativeRouter';
import { getAuthState } from '#helpers/authStore';
import CarouselSelectList from '#ui/CarouselSelectList';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import PressableOpacity from '#ui/PressableOpacity';
import { useHomeScreenContext } from './HomeScreenContext';
import type {
  HomeProfilesCarousel_user$key,
  HomeProfilesCarousel_user$data,
} from '#relayArtifacts/HomeProfilesCarousel_user.graphql';
import type { HomeProfilesCarouselItem_profile$key } from '#relayArtifacts/HomeProfilesCarouselItem_profile.graphql';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type {
  LayoutChangeEvent,
  ListRenderItemInfo,
  ViewStyle,
} from 'react-native';

type HomeProfilesCarouselProps = {
  /**
   * The current user
   */
  user: HomeProfilesCarousel_user$key;
  /**
   * The initial profile index to display
   */
  initialProfileIndex?: number;
};

const HomeProfilesCarousel = ({ user: userKey }: HomeProfilesCarouselProps) => {
  const [coverWidth, setCoverWidth] = useState(0);
  const {
    onCurrentProfileIndexChange,
    currentIndexSharedValue,
    currentIndexProfile,
    initialProfileIndex,
  } = useHomeScreenContext();

  const onLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      setCoverWidth(
        Math.trunc(PixelRatio.roundToNearestPixel(layout.height * COVER_RATIO)),
      );
    },
    [],
  );
  const coverHeight = useMemo(() => coverWidth / COVER_RATIO, [coverWidth]);
  const { profiles } = useFragment(
    graphql`
      fragment HomeProfilesCarousel_user on User {
        profiles {
          id
          webCard {
            id
          }
          ...HomeProfilesCarouselItem_profile
        }
      }
    `,
    userKey,
  );

  useOnFocus(() => {
    const { profileInfos } = getAuthState();
    const authProfileIndex = profiles?.findIndex(
      profile => profile.id === profileInfos?.profileId,
    );

    if (
      authProfileIndex !== undefined &&
      authProfileIndex !== -1 &&
      authProfileIndex + 1 !== currentIndexProfile.value
    ) {
      carouselRef.current?.scrollToIndex(authProfileIndex + 1, false);
    }
  });

  const carouselRef = useRef<CarouselSelectListHandle | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(initialProfileIndex);

  const onSelectedIndexChange = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      onCurrentProfileIndexChange(index);
    },
    [onCurrentProfileIndexChange],
  );

  const scrollToIndex = useCallback(
    (index: number, animated?: boolean) => {
      carouselRef.current?.scrollToIndex(index, animated);
      onSelectedIndexChange(index);
    },
    [onSelectedIndexChange],
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

  const dataSize = useRef(data.length);

  useOnFocus(() => {
    if (dataSize.current > data.length) {
      scrollToIndex(1, true);
      dataSize.current = data.length;
    } else if (dataSize.current !== data.length) {
      dataSize.current = data.length;
    }
  });

  if (profiles == null) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {coverWidth > 0 && (
        <CarouselSelectList
          ref={carouselRef}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          width={windowWidth}
          height={coverHeight}
          itemWidth={coverWidth}
          scaleRatio={SCALE_RATIO}
          style={styles.carousel}
          itemContainerStyle={styles.carouselContentContainer}
          onSelectedIndexChange={onSelectedIndexChange}
          currentProfileIndexSharedValue={currentIndexSharedValue}
          initialScrollIndex={initialProfileIndex}
        />
      )}
    </View>
  );
};

const SCALE_RATIO = 108 / 291;

const keyExtractor = (item: ProfileType | null, index: number) =>
  item?.webCard.id ?? `new_${index}`;

export default memo(HomeProfilesCarousel);

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
        profileRole
        webCard {
          id
          isMultiUser
          userName
          hasCover
          ...CoverLink_webCard
          ...CoverRenderer_webCard
        }
      }
    `,
    item as HomeProfilesCarouselItem_profile$key,
  );

  const [ready, setReady] = useState(!profile?.webCard?.hasCover);
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

  const router = useRouter();

  const onPressMultiUser = useCallback(() => {
    if (isAdmin(profile.profileRole)) {
      router.push({
        route: 'MULTI_USER',
      });
    } else {
      router.push({
        route: 'WEBCARD',
        params: {
          webCardId: profile.webCard.id,
          userName: profile.webCard.userName,
        },
      });
    }
  }, [
    router,
    profile.profileRole,
    profile.webCard.id,
    profile.webCard.userName,
  ]);

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

  const onContainerPress = useCallback(() => {
    if (!isCurrent) {
      scrollToIndex(index);
    }
  }, [scrollToIndex, isCurrent, index]);

  return (
    <Pressable
      style={containerStyle}
      onPress={onContainerPress}
      pointerEvents={isCurrent ? 'box-none' : 'box-only'}
    >
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
            backgroundColor: colors.black,
          }}
        >
          <Icon
            icon="shared_webcard"
            style={styles.invitationIcon}
            tintColor={colors.white}
          />
        </View>
      ) : profile.webCard.hasCover ? (
        <View style={styles.coverLinkWrapper}>
          <CoverLink
            webCard={profile.webCard}
            width={coverWidth}
            webCardId={profile.webCard.id}
            animationEnabled={isCurrent && hasFocus}
            onReadyForDisplay={onReady}
            onError={onError}
          />
          {profile.webCard.isMultiUser && (
            <PressableNative
              style={styles.multiUserContainer}
              onPress={onPressMultiUser}
            >
              <BlurView style={styles.multiUserIconContainer}>
                <Icon icon="shared_webcard" style={styles.multiUserIcon} />
              </BlurView>
            </PressableNative>
          )}
        </View>
      ) : (
        <Link route="COVER_TEMPLATE_SELECTION" params={{ fromHome: true }}>
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
              defaultMessage: 'Create a new WebCard',
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
    </Pressable>
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
    <Link route="WEBCARD_KIND_SELECTION">
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
const windowWidth = Dimensions.get('screen').width;

const styles = StyleSheet.create({
  container: { flex: 1, marginVertical: 15 },
  carousel: {
    flexGrow: 0,
    overflow: 'visible',
    alignSelf: 'center',
    width: windowWidth,
  },
  carouselContentContainer: {
    flexGrow: 0,
    overflow: 'visible',
  },
  coverShadow: Platform.select<ViewStyle>({
    default: shadow('light', 'bottom'),
    android: {},
  }),
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
  invitationIcon: { width: 60, height: 60, opacity: 0.2 },
  coverContainer: {
    overflow: 'visible',
    // trick to have the shadow on the cover
  },
  coverLinkWrapper: { position: 'relative' },
  multiUserContainer: {
    position: 'absolute',
    bottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF66',
    right: 8,
    ...shadow('light', 'bottom'),
  },
  multiUserIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 31,
    height: 31,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#00000033',
  },
  multiUserIcon: {
    width: 17,
    height: 17,
    tintColor: colors.white,
  },
});
