import {
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors, shadow } from '#theme';
import Link from '#components/Link';
import { setMainTabBarOpacity } from '#components/MainTabBar';
import { useCurrentRoute, useRouter } from '#components/NativeRouter';
import WebCardStatHeader, {
  WebCardStatHeaderFallback,
} from '#components/WebCard/WebCardStatHeader';
import ProfilePostsList from '#components/WebCardPostsList';
import { logEvent } from '#helpers/analytics';
import { getAuthState } from '#helpers/authStore';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { profileInfoHasEditorRight } from '#helpers/profileRoleHelper';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import BlurredFloatingButton from '#ui/BlurredFloatingButton';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import TabBarMenuItem from '#ui/TabBarMenuItem';
import TabView from '#ui/TabView';
import Text from '#ui/Text';
import MediaFollowingsScreen from './MediaFollowingsScreen';
import MediaFollowingsWebCards from './MediaFollowingsWebCards';
import MediaSuggestionsScreen, {
  MediaSuggestionsScreenFallback,
} from './MediaSuggestionsScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ScrollableToOffset } from '#helpers/types';
import type { MediaScreenQuery } from '#relayArtifacts/MediaScreenQuery.graphql';
import type { WebCardStatHeader_webCard$key } from '#relayArtifacts/WebCardStatHeader_webCard.graphql';
import type { MediaRoute } from '#routes';
import type { ReactElement } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type TAB = 'FOLLOWINGS' | 'MY_POSTS' | 'SUGGESTIONS';

const mediaScreenQuery = graphql`
  query MediaScreenQuery($profileId: ID!, $viewerWebCardId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        invited
        ...MediaSuggestionsScreen_profile
        ...MediaSuggestionsWebCards_profile
        webCard {
          id
          userName
          cardIsPublished
          coverIsPredefined
          ...WebCardPostsList_webCard
            @arguments(viewerWebCardId: $viewerWebCardId)
          ...PostRendererFragment_author
          ...PostList_author
          ...MediaFollowingsWebCards_webCard
          ...MediaFollowingsScreen_webCard
          ...WebCardStatHeader_webCard
        }
      }
    }
  }
`;

const TAB_CONTAINER_PADDING_TOP = 45;
const resetRoute = ['CONTACTS', 'HOME'];

const DEFAULT_TAB = 'SUGGESTIONS';

const MediaScreen = ({
  preloadedQuery,
  hasFocus = true,
}: RelayScreenProps<MediaRoute, MediaScreenQuery>) => {
  const { node } = usePreloadedQuery(mediaScreenQuery, preloadedQuery);
  const profile = node?.profile;
  const { top, bottom } = useScreenInsets();
  const styles = useStyleSheet(styleSheet);

  const [tab, setTab] = useState<TAB>(DEFAULT_TAB);
  const onTabChange = useCallback((newTab: TAB) => {
    startTransition(() => {
      setTab(newTab);
    });
  }, []);

  const intl = useIntl();

  const router = useRouter();

  useEffect(() => {
    if (hasFocus) {
      setMainTabBarOpacity(1);
    }
  }, [hasFocus]);

  const canBrowseCommunity =
    profile?.webCard?.cardIsPublished &&
    !profile?.invited &&
    !profile?.webCard?.coverIsPredefined;

  useEffect(() => {
    if (!canBrowseCommunity && hasFocus) {
      router.back();
    }
  }, [canBrowseCommunity, hasFocus, router]);

  const onCreatePost = useCallback(() => {
    const { profileInfos } = getAuthState();
    if (profileInfoHasEditorRight(profileInfos)) {
      logEvent('create_post', { source: 'community' });
      router.push({ route: 'NEW_POST' });
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description: 'Error message when trying to create a post',
        }),
      });
    }
  }, [router, intl]);

  const scrollListOffset = useSharedValue(0);
  const stickyPosition = 315 + TAB_CONTAINER_PADDING_TOP;

  const fixedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: scrollListOffset.value < stickyPosition ? 0 : 1,
      transform: [{ translateY: top }],
    };
  });
  const scrollableSuggestionRef: ScrollableToOffset = useRef(null);
  const scrollableFollowingRef: ScrollableToOffset = useRef(null);
  const scrollableMyPostRef: ScrollableToOffset = useRef(null);

  const resetToOffset = useCallback((offset: number) => {
    scrollableSuggestionRef.current?.scrollToOffset({
      offset,
      animated: false,
    });
    scrollableFollowingRef.current?.scrollToOffset({
      offset,
      animated: false,
    });
    scrollableMyPostRef.current?.scrollToOffset({
      offset,
      animated: false,
    });
  }, []);

  useEffect(() => {
    // reset to good position when tab change
    resetToOffset(Math.min(scrollListOffset.value, stickyPosition));
  }, [resetToOffset, scrollListOffset, stickyPosition, tab]);

  const currentRoute = useCurrentRoute('didChange');
  useEffect(() => {
    // reset Screen when route change in bottom TABs
    if (currentRoute && resetRoute.includes(currentRoute.route)) {
      resetToOffset(0);
      setTab(DEFAULT_TAB);
    }
  }, [router, currentRoute, resetToOffset]);

  // viewer might be briefly null when the user logs out or by switching accounts
  if (!profile || !profile.webCard || !canBrowseCommunity) {
    return null;
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollListOffset.value = event.nativeEvent.contentOffset.y;
  };

  const tabs: Array<{ id: TAB; element: ReactElement }> = [
    {
      id: 'SUGGESTIONS',
      element: (
        <MediaSuggestionsScreen
          profile={profile}
          isCurrentTab={tab === 'SUGGESTIONS'}
          canPlay={hasFocus && tab === 'SUGGESTIONS'}
          onScroll={onScroll}
          ListHeaderComponent={
            <ListHeaderComponent
              webCard={profile.webCard}
              tab={tab}
              onTabChange={onTabChange}
            />
          }
          scrollableRef={scrollableSuggestionRef}
        />
      ),
    },
    {
      id: 'FOLLOWINGS',
      element: (
        <Suspense>
          <MediaFollowingsScreen
            webCard={profile.webCard}
            canPlay={hasFocus && tab === 'FOLLOWINGS'}
            onScroll={onScroll}
            scrollableRef={scrollableFollowingRef}
            ListHeaderComponent={
              <>
                <ListHeaderComponent
                  webCard={profile.webCard}
                  tab={tab}
                  onTabChange={onTabChange}
                />
                <MediaFollowingsWebCards
                  header={
                    <Text variant="large" style={styles.coversTitleStyle}>
                      <FormattedMessage
                        defaultMessage="Webcards{azzappA}"
                        description="List of followed profiles"
                        values={{
                          azzappA: <Text variant="azzapp">a</Text>,
                        }}
                      />
                    </Text>
                  }
                  webCard={profile?.webCard}
                />

                <Text style={styles.postsTitleStyle} variant="large">
                  <FormattedMessage
                    defaultMessage="Latest Posts"
                    description="List of latest posts of followed profiles"
                  />
                </Text>
              </>
            }
          />
        </Suspense>
      ),
    },
    {
      id: 'MY_POSTS',
      element: (
        <View style={styles.flex}>
          <Suspense>
            <ProfilePostsList
              webCard={profile.webCard}
              canPlay={hasFocus && tab === 'MY_POSTS'}
              onScroll={onScroll}
              ListHeaderComponent={
                <ListHeaderComponent
                  webCard={profile.webCard}
                  tab={tab}
                  onTabChange={onTabChange}
                />
              }
              scrollableRef={scrollableMyPostRef}
            />
          </Suspense>
        </View>
      ),
    },
  ];

  return (
    <Container style={[styles.flex, { paddingTop: top }]}>
      <Animated.View style={[fixedHeaderStyle, styles.fixedHeaderStyle]}>
        <MediaScreenTabBar currentTab={tab} setTab={onTabChange} />
      </Animated.View>
      <TabView style={styles.flex} currentTab={tab} tabs={tabs} />
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          bottom: bottom + BOTTOM_MENU_HEIGHT + 10,
          width: '100%',
        }}
      >
        <BlurredFloatingButton
          variant="grey"
          style={styles.createPostButton}
          onPress={onCreatePost}
        >
          <Text variant="button" style={styles.createPostButtonLabel}>
            <FormattedMessage
              defaultMessage="Create a new post"
              description="Floating button label to create a post in the media screen"
            />
          </Text>
        </BlurredFloatingButton>
      </View>
    </Container>
  );
};

const ListHeaderComponent = ({
  webCard,
  tab,
  onTabChange,
}: {
  webCard: WebCardStatHeader_webCard$key;
  tab: TAB;
  onTabChange: (newTab: TAB) => void;
}) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View style={styles.flex}>
      <WebCardStatHeader webCard={webCard} />
      <View style={styles.tabBarContainerWithPadding}>
        <MediaScreenTabBar currentTab={tab} setTab={onTabChange} />
      </View>
    </View>
  );
};

const MediaScreenTabBar = ({
  currentTab = 'SUGGESTIONS',
  setTab,
  disabled,
}: {
  currentTab?: TAB;
  setTab?: (tab: TAB) => void;
  disabled?: boolean;
}) => {
  const styles = useStyleSheet(styleSheet);

  const goToSuggestion = () => setTab?.('SUGGESTIONS');
  const goToFollowings = () => setTab?.('FOLLOWINGS');
  const gotToMyPosts = () => setTab?.('MY_POSTS');

  return (
    <View style={styles.tabBarContainer} accessibilityRole="tablist">
      <Link route="SEARCH">
        <PressableNative
          style={styles.search}
          hitSlop={{
            left: 10,
            right: 10,
            top: 10,
            bottom: 10,
          }}
          ripple={{
            borderless: true,
            radius: 20,
          }}
          disabled={disabled}
        >
          <Icon icon="search" style={styles.searchIcon} />
        </PressableNative>
      </Link>
      <TabBarMenuItem
        selected={currentTab === 'SUGGESTIONS'}
        onPress={goToSuggestion}
        disabled={disabled}
      >
        <FormattedMessage
          defaultMessage="For me"
          description="Media screen tab bar item label for suggestions tab"
        />
      </TabBarMenuItem>
      <TabBarMenuItem
        selected={currentTab === 'FOLLOWINGS'}
        onPress={goToFollowings}
        disabled={disabled}
      >
        <FormattedMessage
          defaultMessage="Following"
          description="Media screen tab bar item label for followings tab"
        />
      </TabBarMenuItem>

      <TabBarMenuItem
        selected={currentTab === 'MY_POSTS'}
        onPress={gotToMyPosts}
        disabled={disabled}
      >
        <FormattedMessage
          defaultMessage="My posts"
          description="Media screen tab bar item label for my posts tab"
        />
      </TabBarMenuItem>
    </View>
  );
};

const MediaScreenFallback = () => {
  const { top } = useScreenInsets();
  const styles = useStyleSheet(styleSheet);

  return (
    <Container style={[styles.flex, { paddingTop: top }]}>
      <WebCardStatHeaderFallback />
      <MediaScreenTabBar disabled />
      <MediaSuggestionsScreenFallback />
    </Container>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  flex: { flex: 1 },
  search: { marginLeft: 25 },
  searchIcon: { width: 28, height: 28 },
  tabBarContainerWithPadding: { paddingTop: TAB_CONTAINER_PADDING_TOP },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 5,
    paddingVertical: 9,
  },
  coversTitleStyle: {
    marginHorizontal: 10,
    marginTop: 6.5,
  },
  postsTitleStyle: {
    marginHorizontal: 10,
    marginBottom: 20,
  },
  createPostButton: {
    width: 200,
    height: 50,
  },
  createPostButtonLabel: {
    color: colors.white,
  },
  fixedHeaderStyle: {
    zIndex: 3,
    position: 'absolute',
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    ...shadow({
      appearance,
      direction: 'bottom',
      forceOldShadow: true,
      color:
        appearance === 'dark'
          ? { r: 0, g: 0, b: 0, a: 0.4 }
          : { r: 255, g: 255, b: 255, a: 0.9 },
    }),
  },
}));

export default relayScreen(MediaScreen, {
  query: mediaScreenQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
    viewerWebCardId: profileInfos?.webCardId ?? '',
  }),
  fallback: MediaScreenFallback,
});
