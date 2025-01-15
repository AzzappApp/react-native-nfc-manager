import { BlurView } from 'expo-blur';
import {
  forwardRef,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { ENABLE_MULTI_USER } from '#Config';
import { colors, shadow } from '#theme';
import CoverErrorRenderer from '#components/CoverErrorRenderer';
import CoverLink from '#components/CoverLink';
import CoverLoadingIndicator from '#components/CoverLoadingIndicator';
import CoverRenderer from '#components/CoverRenderer';
import Link from '#components/Link';
import { useOnFocus, useRouter } from '#components/NativeRouter';
import WebCardMenu from '#components/WebCardMenu';
import { logEvent } from '#helpers/analytics';
import { getAuthState, onChangeWebCard } from '#helpers/authStore';
import {
  profileInfoHasAdminRight,
  profileInfoIsOwner,
} from '#helpers/profileRoleHelper';
import { useTooltipContext } from '#helpers/TooltipContext';
import useBoolean from '#hooks/useBoolean';
import useLatestCallback from '#hooks/useLatestCallback';
import useToggleFollow from '#hooks/useToggleFollow';
import CarouselSelectList from '#ui/CarouselSelectList';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import PressableOpacity from '#ui/PressableOpacity';
import { useHomeScreenContext } from './HomeScreenContext';
import useCoverPlayPermission from './useCoverPlayPermission';
import type {
  HomeProfilesCarousel_user$key,
  HomeProfilesCarousel_user$data,
} from '#relayArtifacts/HomeProfilesCarousel_user.graphql';
import type { HomeProfilesCarouselItem_profile$key } from '#relayArtifacts/HomeProfilesCarouselItem_profile.graphql';
import type {
  CarouselSelectListHandle,
  CarouselSelectListRenderItemInfo,
} from '#ui/CarouselSelectList';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ForwardedRef } from 'react';
import type { ViewStyle } from 'react-native';

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

const HomeProfilesCarousel = (
  { user: userKey }: HomeProfilesCarouselProps,
  forwardedRef: ForwardedRef<CarouselSelectListHandle>,
) => {
  const {
    onCurrentProfileIndexChange,
    currentIndexSharedValue,
    currentIndexProfileSharedValue,
    initialProfileIndex,
  } = useHomeScreenContext();
  const { registerTooltip, unregisterTooltip } = useTooltipContext();

  const { profiles } = useFragment(
    graphql`
      fragment HomeProfilesCarousel_user on User {
        profiles {
          id
          profileRole
          invited
          webCard {
            id
            userName
          }
          ...HomeProfilesCarouselItem_profile
        }
      }
    `,
    userKey,
  );

  const changeIndexTimeout = useRef<any | null>(null);
  const onCurrentProfileIndexChangeLatest = useLatestCallback(
    onCurrentProfileIndexChange,
  );
  const onSelectedIndexChange = useCallback(
    (index: number) => {
      clearTimeout(changeIndexTimeout.current);
      setSelectedIndex(index);
      onCurrentProfileIndexChangeLatest(index);
    },
    [onCurrentProfileIndexChangeLatest],
  );

  const onSelectedIndexChangeLatest = useLatestCallback(onSelectedIndexChange);
  const scrollToIndex = useCallback(
    (index: number, animated?: boolean) => {
      carouselRef.current?.scrollToIndex(index, animated);
      // On android onMomentumScrollEnd is not called when scrollToIndex is called
      changeIndexTimeout.current = setTimeout(() => {
        onSelectedIndexChangeLatest(index);
      }, 300);
    },
    [onSelectedIndexChangeLatest],
  );

  useImperativeHandle(forwardedRef, () => ({ scrollToIndex }), [scrollToIndex]);

  useOnFocus(() => {
    const { profileInfos } = getAuthState();
    const authProfileIndex = profiles?.findIndex(
      profile => profile.id === profileInfos?.profileId,
    );
    if (
      authProfileIndex !== undefined &&
      authProfileIndex !== -1 &&
      authProfileIndex + 1 !== currentIndexProfileSharedValue.get()
    ) {
      carouselRef.current?.scrollToIndex(authProfileIndex + 1, false);
    }
  });

  const carouselRef = useRef<CarouselSelectListHandle | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(initialProfileIndex);

  // This useEffect allows to refresh index when profiles list change
  useEffect(() => {
    const { profileInfos } = getAuthState();
    const index = profiles?.findIndex(
      profile => profile.id === profileInfos?.profileId,
    );
    if (index === -1 && profiles?.length === 0) {
      // no more profile available
      setSelectedIndex(0);
    } else if (index !== undefined && index !== -1) {
      // new profile has been created (typically from invitation).
      // scroll to the same selected profile.
      setSelectedIndex(index + 1);
    } else {
      // profile has been removed,
      // scroll to previous available profile.
      const newindex = selectedIndex - 2 > 0 ? selectedIndex - 2 : 0;
      const profile = profiles?.[newindex];
      if (profile) {
        onChangeWebCard({
          profileId: profile.id,
          webCardId: profile.webCard?.id ?? null,
          profileRole: profile.profileRole,
          invited: profile.invited,
          webCardUserName: profile.webCard?.userName,
        });
      } else {
        onChangeWebCard(null);
      }
      setSelectedIndex(newindex);
    }
    // No need to refresh when index change. Here we handle only profiles list update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles]);

  const data = useMemo(
    () =>
      profiles
        ? [
            { profile: null, isCurrent: selectedIndex === 0 },
            ...profiles.map((profile, i) => ({
              profile,
              isCurrent: selectedIndex === i + 1,
            })),
          ]
        : [{ profile: null, isCurrent: true }],
    [profiles, selectedIndex],
  );

  const renderItem = useCallback(
    ({
      item: { profile, isCurrent },
      index,
      width,
      height,
    }: CarouselSelectListRenderItemInfo<{
      profile: ProfileType | null;
      isCurrent: boolean;
    }>) => {
      if (profile) {
        return (
          <ItemRender
            item={profile}
            coverHeight={height}
            coverWidth={width}
            index={index}
            scrollToIndex={scrollToIndex}
            isCurrent={isCurrent}
          />
        );
      }

      return <CreateItemMemo coverHeight={height} coverWidth={width} />;
    },
    [scrollToIndex],
  );

  const { width: windowWidth } = useWindowDimensions();

  const refCarousel = useRef(null);

  useEffect(() => {
    registerTooltip('profileCarousel', {
      ref: refCarousel,
    });

    return () => {
      unregisterTooltip('profileCarousel');
    };
  }, [registerTooltip, unregisterTooltip]);

  if (profiles == null) {
    return null;
  }

  return (
    <View
      ref={refCarousel}
      style={[styles.container, { maxHeight: windowWidth / (2 * COVER_RATIO) }]}
    >
      <CarouselSelectList
        ref={carouselRef}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        itemRatio={COVER_RATIO}
        scaleRatio={SCALE_RATIO}
        style={styles.carousel}
        itemContainerStyle={styles.carouselContentContainer}
        onSelectedIndexChange={onSelectedIndexChange}
        currentProfileIndexSharedValue={currentIndexSharedValue}
        initialScrollIndex={initialProfileIndex}
      />
    </View>
  );
};

const SCALE_RATIO = 108 / 291;

const MARGIN_VERTICAL = 15;

const keyExtractor = (item: { profile: ProfileType | null }, index: number) =>
  item.profile?.webCard?.id ?? `new_${index}`;

export default forwardRef(HomeProfilesCarousel);

type ProfileType = ArrayItemType<HomeProfilesCarousel_user$data['profiles']>;

type ItemRenderProps = {
  index: number;
  item: ProfileType;
  coverWidth: number;
  coverHeight: number;
  scrollToIndex: (index: number, animated?: boolean) => void;
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
          webCardKind
          userName
          hasCover
          coverIsPredefined
          ...CoverLink_webCard
          ...CoverRenderer_webCard
          ...WebCardMenu_webCard
        }
      }
    `,
    item as HomeProfilesCarouselItem_profile$key,
  );

  const onToggleFollow = useToggleFollow();
  const [ready, setReady] = useState(!profile?.webCard?.hasCover);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [showWebcardModal, openWebcardModal, closeWebcardModal] =
    useBoolean(false);
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
    if (profileInfoHasAdminRight(profile)) {
      router.push({
        route: 'MULTI_USER',
      });
    } else if (profile.webCard?.userName) {
      router.push({
        route: 'WEBCARD',
        params: {
          webCardId: profile.webCard.id,
          userName: profile.webCard.userName,
        },
      });
    }
  }, [profile, router]);

  const { paused, canPlay } = useCoverPlayPermission();

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
      scrollToIndex(index, true);
    }
  }, [scrollToIndex, isCurrent, index]);

  const onPressEdit = () => {
    router.push({
      route: 'COVER_TEMPLATE_SELECTION',
    });
  };

  const { registerTooltip, unregisterTooltip } = useTooltipContext();

  const refEdit = useRef(null);
  const refMulti = useRef(null);

  useEffect(() => {
    if (isCurrent) {
      registerTooltip('profileEdit', {
        ref: refEdit,
      });
      registerTooltip('profileMulti', {
        ref: refMulti,
      });
    }

    return () => {
      unregisterTooltip('profileEdit');
      unregisterTooltip('profileMulti');
    };
  }, [isCurrent, registerTooltip, unregisterTooltip]);

  const isMultiUser =
    profile.webCard?.isMultiUser || profile.webCard?.webCardKind === 'business';

  return (
    <>
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
        ) : profile.webCard?.hasCover ? (
          <View style={styles.coverLinkWrapper}>
            <CoverLink
              webCard={profile.webCard}
              width={coverWidth}
              webCardId={profile.webCard.id}
              canPlay={isCurrent && canPlay}
              paused={paused}
              onReadyForDisplay={onReady}
              onError={onError}
              onLongPress={openWebcardModal}
            />
            {profile.webCard?.coverIsPredefined && (
              <PressableNative
                style={styles.editUserContainer}
                onPress={onPressEdit}
                android_ripple={{
                  borderless: true,
                  foreground: true,
                }}
              >
                <BlurView style={styles.multiUserIconContainer}>
                  <View ref={refEdit} style={styles.tooltipTarget} />
                  <Icon icon="edit" style={styles.multiUserIcon} />
                </BlurView>
              </PressableNative>
            )}
            {isMultiUser && ENABLE_MULTI_USER && (
              <PressableNative
                style={styles.multiUserContainer}
                onPress={onPressMultiUser}
                android_ripple={{
                  borderless: true,
                  foreground: true,
                }}
              >
                <BlurView style={styles.multiUserIconContainer}>
                  <View ref={refMulti} style={styles.tooltipTarget} />
                  <Icon icon="shared_webcard" style={styles.multiUserIcon} />
                </BlurView>
              </PressableNative>
            )}
          </View>
        ) : (
          <Link route="COVER_TEMPLATE_SELECTION" params={{ fromHome: true }}>
            <PressableOpacity
              style={{
                width: coverWidth,
                height: coverHeight,
                borderRadius: coverWidth * COVER_CARD_RADIUS,
                overflow: 'visible',
              }}
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
      {profile.webCard && (
        <Suspense fallback={null}>
          <WebCardMenu
            visible={showWebcardModal}
            webCard={profile.webCard}
            close={closeWebcardModal}
            onToggleFollow={onToggleFollow}
            isViewer
            isOwner={profileInfoIsOwner(profile)}
            isAdmin={profileInfoHasAdminRight(profile)}
          />
        </Suspense>
      )}
    </>
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
    <Link route="CONTACT_CARD_CREATE">
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
          defaultMessage: 'Create a new WebCard',
          description: 'Start new profile creation from account screen',
        })}
        onPress={() => logEvent('CreateWebCard', { source: 'HomeScreen' })}
      >
        <Icon icon="add" style={styles.icon} />
      </PressableOpacity>
    </Link>
  );
};

const CreateItemMemo = memo(CreateItem);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: MARGIN_VERTICAL,
  },
  carousel: {
    flex: 1,
    overflow: 'visible',
  },
  carouselContentContainer: {
    flexGrow: 1,
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
  editUserContainer: {
    position: 'absolute',
    bottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF66',
    left: 8,
    ...shadow('light', 'bottom'),
  },
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
  tooltipTarget: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 10,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
});
