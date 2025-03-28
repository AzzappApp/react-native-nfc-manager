import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import { useRouter } from '#components/NativeRouter';
import { getAuthState, onChangeWebCard } from '#helpers/authStore';
import useBoolean from '#hooks/useBoolean';
import useNotificationsEvent, {
  useNotificationsManager,
} from '#hooks/useNotifications';
import useScreenInsets from '#hooks/useScreenInsets';
import useWidget from '#hooks/useWidget';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import HomeBackground from './HomeBackground';
import HomeBottomPanel from './HomeBottomPanel';
import HomeBottomSheetPanel from './HomeBottomSheetPanel';
import HomeBottomSheetPopupPanel from './HomeBottomSheetPopupPanel';
import HomeHeader from './HomeHeader';
import HomeProfileLink from './HomeProfileLink';
import HomeProfilesCarousel from './HomeProfilesCarousel';
import { useHomeScreenContext } from './HomeScreenContext';
import Tooltips from './Tooltips';
import type { HomeScreenContent_user$key } from '#relayArtifacts/HomeScreenContent_user.graphql';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';
import type { NotificationType } from '@azzapp/shared/notificationHelpers';
import type { Ref } from 'react';

type HomeScreenContentProps = {
  user: HomeScreenContent_user$key;
  selectListRef: Ref<CarouselSelectListHandle>;
  refreshQuery: (() => void) | undefined;
};

const HomeScreenContent = ({
  user: userKey,
  selectListRef,
  refreshQuery,
}: HomeScreenContentProps) => {
  // #regions data
  const user = useFragment(
    graphql`
      fragment HomeScreenContent_user on User {
        id
        profiles {
          id
          profileRole
          invited
          webCard {
            id
            cardIsPublished
            userName
            coverIsPredefined
          }
          ...HomeBottomSheetPanel_profile
          ...HomeBottomSheetPopupPanel_profile
        }
        ...HomeBottomSheetPanel_user
        ...useWidget_user
        ...HomeBackground_user
        ...HomeProfileLink_user
        ...HomeProfilesCarousel_user
        ...HomeBottomPanel_user
        ...HomeHeader_user
      }
    `,
    userKey,
  );

  const onDeepLinkInApp = useCallback(
    (deepLink: NotificationType) => {
      if (deepLink === 'multiuser_invitation') {
        refreshQuery?.();
      }
    },
    [refreshQuery],
  );

  const router = useRouter();

  const changeWebCardTimeout = useRef<ReturnType<typeof setTimeout>>();

  const redirectDeepLink = useCallback(
    (deepLink: NotificationType, webCardId: string) => {
      switch (deepLink) {
        case 'shareBack':
          router.push({
            route: 'CONTACTS',
          });
          break;
        case 'webCardUpdate':
          router.push({
            route: 'WEBCARD',
            params: {
              webCardId,
            },
          });
          break;
        default:
          break;
      }
    },
    [router],
  );

  const onDeepLinkOpenedApp = useCallback(
    (deepLink: NotificationType, extraData?: object | string) => {
      if (
        typeof extraData === 'object' &&
        'webCardId' in extraData &&
        typeof extraData.webCardId === 'string'
      ) {
        const webCardId = extraData.webCardId;
        const newProfile = user.profiles?.find(
          p => p.webCard?.id === extraData.webCardId,
        );
        const { profileInfos } = getAuthState();

        if (newProfile && newProfile.id !== profileInfos?.profileId) {
          changeWebCardTimeout.current = setTimeout(() => {
            onChangeWebCard({
              profileId: newProfile.id,
              profileRole: newProfile.profileRole,
              invited: newProfile.invited,
              webCardId: newProfile.webCard?.id,
              webCardUserName: newProfile.webCard?.userName,
              cardIsPublished: newProfile.webCard?.cardIsPublished,
              coverIsPredefined: newProfile.webCard?.coverIsPredefined,
            });
            redirectDeepLink(deepLink, webCardId);
          }, 350);
          // 350ms, allows to bypass HomeProfile workaround timeout see related code:
          // changeIndexTimeout.current = setTimeout(() => {
          //   onSelectedIndexChangeLatest(index);
          // }, 300);
        } else {
          redirectDeepLink(deepLink, webCardId);
        }
      }
    },
    [redirectDeepLink, user.profiles],
  );

  useEffect(() => clearTimeout(changeWebCardTimeout.current), []);

  const { notificationAuthorized, requestNotificationPermission } =
    useNotificationsManager();

  useNotificationsEvent({
    onDeepLinkInApp,
    onDeepLinkOpenedApp,
  });

  //TODO: improve the way to ask for notificatino permission, for now, we are asking for notification permission if the user has a published card
  useEffect(() => {
    if (!notificationAuthorized && user?.profiles && user.profiles.length > 0) {
      const hasPublishedCard = user.profiles.some(
        profile => profile.webCard?.cardIsPublished,
      );
      if (hasPublishedCard) {
        requestNotificationPermission();
      }
    }
  }, [notificationAuthorized, requestNotificationPermission, user.profiles]);
  //#endregion

  //#region profile switch

  const { currentIndexProfileSharedValue, initialProfileIndex } =
    useHomeScreenContext();

  const [currentProfile, setCurrentProfile] = useState(
    user.profiles?.[initialProfileIndex - 1],
  );
  const debouncedUpdate = useDebouncedCallback(setCurrentProfile, 500);

  useAnimatedReaction(
    () => currentIndexProfileSharedValue.value,
    index => {
      const cProfile = user.profiles?.[index - 1];
      runOnJS(debouncedUpdate)(cProfile);
    },
  );

  // TODO: here we rely on polling on HOME to check if the profileRole has changed. We should have a better way to keep our app state in sync with the server.
  useEffect(() => {
    if (currentProfile?.profileRole) {
      onChangeWebCard({
        profileRole: currentProfile.profileRole,
      });
    }
  }, [currentProfile?.profileRole]);
  //#endregion

  // #region bottomMenu
  const [showMenu, , closeMenu, toggleMenu] = useBoolean(false);

  // #endregion
  const insets = useScreenInsets();
  const homeContentContainerStyle = useMemo(
    () => [
      styles.container,
      {
        marginTop: insets.top + HOME_SCREEN_CONTENT_PADDING,
        marginBottom:
          insets.bottom + BOTTOM_MENU_HEIGHT + HOME_SCREEN_CONTENT_PADDING,
      },
    ],
    [insets.bottom, insets.top],
  );

  //#region widget
  useWidget(user ?? null);
  //#endregion

  return (
    <View style={styles.container}>
      <HomeBackground user={user} />
      <View style={homeContentContainerStyle}>
        <HomeHeader openPanel={toggleMenu} user={user} />
        <HomeProfileLink user={user} />
        <HomeProfilesCarousel ref={selectListRef} user={user} />
        <Suspense>
          <HomeBottomPanel user={user} />
        </Suspense>
      </View>
      <Suspense>
        <HomeBottomSheetPanel
          visible={showMenu}
          close={closeMenu}
          user={user}
          profile={currentProfile ?? null}
        />
      </Suspense>
      {currentProfile?.webCard && !currentProfile.webCard.userName && (
        <HomeBottomSheetPopupPanel profile={currentProfile ?? null} />
      )}
      <Tooltips />
    </View>
  );
};
//usage of memo tested with whyDidYouRender, reducing render due to context change
export default memo(HomeScreenContent);

export const HOME_SCREEN_CONTENT_PADDING = 15;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
  },
});
