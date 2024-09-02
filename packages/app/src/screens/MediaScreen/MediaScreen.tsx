import { Suspense, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import Link from '#components/Link';
import { useMainTabBarVisibilityController } from '#components/MainTabBar';
import { useRouter } from '#components/NativeRouter';
import ProfilePostsList from '#components/WebCardPostsList';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
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
          ...WebCardPostsList_webCard
            @arguments(viewerWebCardId: $viewerWebCardId)
          ...PostRendererFragment_author
          ...MediaFollowingsWebCards_webCard
          ...MediaFollowingsScreen_webCard
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
  const { top } = useScreenInsets();
  const [tab, setTab] = useState<TAB>('SUGGESTIONS');

  const router = useRouter();

  useMainTabBarVisibilityController(true);

  useEffect(() => {
    if (profile?.invited || !profile?.webCard?.cardIsPublished) {
      router.replace({ route: 'HOME' });
    }
  }, [profile?.invited, profile?.webCard?.cardIsPublished, router]);

  // viewer might be briefly null when the user logs out or by switching accounts
  if (!profile || !profile.webCard) {
    return null;
  }

  const tabs: Array<{ id: TAB; element: ReactElement }> = [
    {
      id: 'SUGGESTIONS',
      element: (
        <Suspense fallback={<MediaSuggestionsScreenFallback />}>
          <MediaSuggestionsScreen
            profile={profile}
            isCurrentTab={tab === 'SUGGESTIONS'}
            canPlay={hasFocus && tab === 'SUGGESTIONS'}
          />
        </Suspense>
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
                  style={styles.coverList}
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
              canPlay={hasFocus && tab === 'MY_POSTS'}
            />
          </Suspense>
        </View>
      ),
    },
  ];

  return (
    <Container style={{ flex: 1, marginTop: top }}>
      <MediaScreenTabBar currentTab={tab} setTab={setTab} />
      <TabView style={{ flex: 1 }} currentTab={tab} tabs={tabs} />
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
    <Container
      style={{
        flex: 1,
        marginTop: top,
      }}
    >
      <MediaScreenTabBar disabled />
      <MediaSuggestionsScreenFallback />
    </Container>
  );
};

const styles = StyleSheet.create({
  tabsContainer: { flex: 1, paddingTop: 20 },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 5,
    paddingVertical: 9,
  },
  tab: {
    width: 83,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 33,
  },
  coverList: {
    overflow: 'visible',
  },
  coversTitleStyle: {
    marginHorizontal: 10,
    marginTop: 6.5,
  },
  postsTitleStyle: {
    marginHorizontal: 10,
    marginBottom: 20,
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
