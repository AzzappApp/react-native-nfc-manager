import { Image, View, useWindowDimensions } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useMainTabBarVisiblilityController } from '#components/MainTabBar';
import relayScreen from '#helpers/relayScreen';
import useToggle from '#hooks/useToggle';
import ActivityIndicator from '#ui/ActivityIndicator';
import { ACTIVITY_INDICATOR_WIDTH } from '#ui/ActivityIndicator/ActivityIndicator';
import HomeBottomSheetPanel from './HomeBottomSheetPanel';
import HomeScreenContent from './HomeScreenContent';
import WelcomeScreen from './WelcomeScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { HomeRoute } from '#routes';
import type { HomeScreenQuery } from '@azzapp/relay/artifacts/HomeScreenQuery.graphql';

export const homeScreenQuery = graphql`
  query HomeScreenQuery {
    currentUser {
      profiles {
        id
      }
      ...HomeScreenContent_user
    }
  }
`;

const HomeScreen = ({
  preloadedQuery,
}: RelayScreenProps<HomeRoute, HomeScreenQuery>) => {
  // data
  const { currentUser } = usePreloadedQuery(homeScreenQuery, preloadedQuery);
  const hasProfiles = !!currentUser.profiles?.length;

  const [showMenu, toggleShowMenu] = useToggle(false);
  return (
    <>
      {hasProfiles ? (
        <HomeScreenContent user={currentUser} onShowMenu={toggleShowMenu} />
      ) : (
        <WelcomeScreen onShowMenu={toggleShowMenu} />
      )}
      <HomeBottomSheetPanel visible={showMenu} close={toggleShowMenu} />
    </>
  );
};

const HomeScreenFallback = () => {
  useMainTabBarVisiblilityController(false, true);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  return (
    <View
      style={{
        flex: 1,
        gap: 20,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={require('#assets/logo-full.png')}
        style={{
          width: 180,
          height: 38,
        }}
      />
      <ActivityIndicator
        style={{
          position: 'absolute',
          top: windowHeight / 2 + 40,
          left: (windowWidth - ACTIVITY_INDICATOR_WIDTH) / 2,
        }}
      />
    </View>
  );
};

export default relayScreen(HomeScreen, {
  query: homeScreenQuery,
  fallback: HomeScreenFallback,
  canGoback: false,
});
