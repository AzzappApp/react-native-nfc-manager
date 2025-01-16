import {
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import Link from '#components/Link';
import { setMainTabBarOpacity } from '#components/MainTabBar';
import { useRouter } from '#components/NativeRouter';
import ProfilePostsList from '#components/WebCardPostsList';
import { logEvent } from '#helpers/analytics';
import { getAuthState } from '#helpers/authStore';
import { profileInfoHasEditorRight } from '#helpers/profileRoleHelper';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import FloatingButton from '#ui/FloatingButton';
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
import type { MediaScreenQuery } from '#relayArtifacts/MediaScreenQuery.graphql';
import type { MediaRoute } from '#routes';
import type { ReactElement } from 'react';

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
          ...PostList_viewerWebCard
        }
      }
    }
  }
`;

const MediaScreen = ({
  preloadedQuery,
  hasFocus = true,
}: RelayScreenProps<MediaRoute, MediaScreenQuery>) => {
  const { node } = usePreloadedQuery(mediaScreenQuery, preloadedQuery);
  const profile = node?.profile;
  const { top, bottom } = useScreenInsets();
  const [tab, setTab] = useState<TAB>('SUGGESTIONS');
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

  // viewer might be briefly null when the user logs out or by switching accounts
  if (!profile || !profile.webCard || !canBrowseCommunity) {
    return null;
  }

  const tabs: Array<{ id: TAB; element: ReactElement }> = [
    {
      id: 'SUGGESTIONS',
      element: (
        <MediaSuggestionsScreen
          profile={profile}
          isCurrentTab={tab === 'SUGGESTIONS'}
          canPlay={hasFocus && tab === 'SUGGESTIONS'}
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
            ListHeaderComponent={
              <View>
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
              </View>
            }
          />
        </Suspense>
      ),
    },
    {
      id: 'MY_POSTS',
      element: (
        <View style={{ flex: 1 }}>
          <Suspense>
            <ProfilePostsList
              webCard={profile.webCard}
              viewerWebCard={profile.webCard}
              canPlay={hasFocus && tab === 'MY_POSTS'}
            />
          </Suspense>
        </View>
      ),
    },
  ];

  return (
    <Container style={{ flex: 1, paddingTop: top }}>
      <MediaScreenTabBar currentTab={tab} setTab={onTabChange} />
      <TabView style={{ flex: 1 }} currentTab={tab} tabs={tabs} />
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          bottom: bottom + BOTTOM_MENU_HEIGHT + 10,
          width: '100%',
        }}
      >
        <FloatingButton
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
        </FloatingButton>
      </View>
    </Container>
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
  return (
    <View style={styles.tabBarContainer} accessibilityRole="tablist">
      <Link route="SEARCH">
        <PressableNative
          style={{ marginLeft: 25 }}
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
          <Icon icon="search" style={{ width: 28, height: 28 }} />
        </PressableNative>
      </Link>
      <TabBarMenuItem
        selected={currentTab === 'SUGGESTIONS'}
        onPress={() => setTab?.('SUGGESTIONS')}
        disabled={disabled}
      >
        <FormattedMessage
          defaultMessage="For me"
          description="Media screen tab bar item label for suggestions tab"
        />
      </TabBarMenuItem>
      <TabBarMenuItem
        selected={currentTab === 'FOLLOWINGS'}
        onPress={() => setTab?.('FOLLOWINGS')}
        disabled={disabled}
      >
        <FormattedMessage
          defaultMessage="Following"
          description="Media screen tab bar item label for followings tab"
        />
      </TabBarMenuItem>

      <TabBarMenuItem
        selected={currentTab === 'MY_POSTS'}
        onPress={() => setTab?.('MY_POSTS')}
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
  return (
    <Container style={{ flex: 1, paddingTop: top }}>
      <MediaScreenTabBar disabled />
      <MediaSuggestionsScreenFallback />
    </Container>
  );
};

const styles = StyleSheet.create({
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
});

export default relayScreen(MediaScreen, {
  query: mediaScreenQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
    viewerWebCardId: profileInfos?.webCardId ?? '',
  }),
  fallback: MediaScreenFallback,
});
