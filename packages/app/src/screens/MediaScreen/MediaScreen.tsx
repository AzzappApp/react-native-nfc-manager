import { Suspense, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import Link from '#components/Link';
import ProfilePostsList from '#components/ProfilePostsList';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import TabBarMenuItem from '#ui/TabBarMenuItem';
import TabView from '#ui/TabView';
import Text from '#ui/Text';
import MediaFollowingsProfiles from './MediaFollowingsProfiles';
import MediaFollowingsScreen from './MediaFollowingsScreen';
import MediaSuggestionsProfiles from './MediaSuggestionsProfiles';
import MediaSuggestionsScreen from './MediaSuggestionsScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { MediaRoute } from '#routes';
import type { MediaScreenQuery } from '@azzapp/relay/artifacts/MediaScreenQuery.graphql';
import type { ReactElement } from 'react';

type TAB = 'FOLLOWINGS' | 'MY_POSTS' | 'SUGGESTIONS';

const mediaScreenQuery = graphql`
  query MediaScreenQuery {
    viewer {
      profile {
        id
        userName
        ...ProfilePostsList_profile
        ...PostRendererFragment_author
      }
      ...MediaSuggestionsScreen_viewer
      ...MediaSuggestionsProfiles_viewer
      ...MediaFollowingsScreen_viewer
      ...MediaFollowingsProfiles_viewer
    }
  }
`;

const MediaScreen = ({
  preloadedQuery,
  hasFocus = true,
}: RelayScreenProps<MediaRoute, MediaScreenQuery>) => {
  const { viewer } = usePreloadedQuery(mediaScreenQuery, preloadedQuery);
  const { top } = useScreenInsets();
  const [tab, setTab] = useState<TAB>('SUGGESTIONS');

  // viewer might be briefly null when the user logs out or by switching accounts
  if (!viewer) {
    return null;
  }

  const tabs: Array<{ id: TAB; element: ReactElement }> = [
    {
      id: 'SUGGESTIONS',
      element: (
        <MediaSuggestionsScreen
          viewer={viewer}
          canPlay={hasFocus && tab === 'SUGGESTIONS'}
          ListHeaderComponent={
            <View>
              <MediaSuggestionsProfiles
                header={
                  <Text variant="large" style={styles.coversTitleStyle}>
                    <FormattedMessage
                      defaultMessage="Webcards{azzappAp} to follow"
                      description="List of suggested profiles"
                      values={{
                        azzappAp: <Text variant="azzapp">a</Text>,
                      }}
                    />
                  </Text>
                }
                coverListStyle={styles.coverList}
                viewer={viewer}
              />
              <Text style={styles.postsTitleStyle} variant="large">
                <FormattedMessage
                  defaultMessage="Posts"
                  description="List of suggested posts"
                />
              </Text>
            </View>
          }
        />
      ),
    },
    {
      id: 'FOLLOWINGS',
      element: (
        <Suspense>
          <MediaFollowingsScreen
            viewer={viewer}
            canPlay={hasFocus && tab === 'FOLLOWINGS'}
            ListHeaderComponent={
              <View>
                <MediaFollowingsProfiles
                  header={
                    <Text variant="large" style={styles.coversTitleStyle}>
                      <FormattedMessage
                        defaultMessage="Webcards"
                        description="List of followed profiles"
                      />
                    </Text>
                  }
                  viewer={viewer}
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
  ];

  if (viewer.profile) {
    tabs.push({
      id: 'MY_POSTS',
      element: (
        <View style={{ flex: 1 }}>
          <Suspense>
            <ProfilePostsList
              profile={viewer.profile}
              canPlay={hasFocus && tab === 'MY_POSTS'}
            />
          </Suspense>
        </View>
      ),
    });
  }

  return (
    <Container style={{ flex: 1, marginTop: top }}>
      <MediaScreenTabBar currentTab={tab} setTab={setTab} />
      <TabView style={{ flex: 1 }} currentTab={tab} tabs={tabs} />
    </Container>
  );
};

const MediaScreenTabBar = ({
  currentTab,
  setTab,
}: {
  currentTab: TAB;
  setTab: (tab: TAB) => void;
}) => {
  return (
    <View style={styles.tabBarContainer} accessibilityRole="tablist">
      <Link route="SEARCH">
        <PressableNative style={{ paddingLeft: 25 }}>
          <Icon icon="search" style={{ width: 28, height: 28 }} />
        </PressableNative>
      </Link>
      <TabBarMenuItem
        selected={currentTab === 'SUGGESTIONS'}
        setSelected={() => setTab('SUGGESTIONS')}
      >
        <FormattedMessage
          defaultMessage="For me"
          description="Media screen tab bar item label for suggestions tab"
        />
      </TabBarMenuItem>
      <TabBarMenuItem
        selected={currentTab === 'FOLLOWINGS'}
        setSelected={() => setTab('FOLLOWINGS')}
      >
        <FormattedMessage
          defaultMessage="Following"
          description="Media screen tab bar item label for followings tab"
        />
      </TabBarMenuItem>

      <TabBarMenuItem
        selected={currentTab === 'MY_POSTS'}
        setSelected={() => setTab('MY_POSTS')}
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
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator />
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
    marginBottom: 16.5,
    marginTop: 6.5,
  },
  postsTitleStyle: {
    marginHorizontal: 10,
    marginVertical: 20,
  },
});

export default relayScreen(MediaScreen, {
  query: mediaScreenQuery,
  fallback: MediaScreenFallback,
});
