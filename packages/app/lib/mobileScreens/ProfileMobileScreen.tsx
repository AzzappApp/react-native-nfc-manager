import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/lib/cardHelpers';
import { useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useNativeNavigationEvent } from '../components/NativeRouter';
import relayScreen from '../helpers/relayScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type { ScreenOptions } from '../components/NativeRouter';
import type { RelayScreenProps } from '../helpers/relayScreen';
import type { ProfileRoute } from '../routes';
import type { ProfileMobileScreenByIdQuery } from '@azzapp/relay/artifacts/ProfileMobileScreenByIdQuery.graphql';
import type { ProfileMobileScreenByUserNameQuery } from '@azzapp/relay/artifacts/ProfileMobileScreenByUserNameQuery.graphql';

const ProfileMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<
  ProfileRoute,
  ProfileMobileScreenByIdQuery | ProfileMobileScreenByUserNameQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  const [ready, setReady] = useState(false);
  useNativeNavigationEvent('appear', () => {
    setReady(true);
  });

  if (!data.profile) {
    return null;
  }

  return <ProfileScreen ready={ready} profile={data.profile} />;
};

const getQuery = (params: ProfileRoute['params']) =>
  params.profileID ? profileScreenByIdQuery : profileScreenByNameQuery;

const profileScreenByIdQuery = graphql`
  query ProfileMobileScreenByIdQuery($profileID: ID!) {
    profile: node(id: $profileID) {
      ...ProfileScreen_profile
    }
  }
`;

const profileScreenByNameQuery = graphql`
  query ProfileMobileScreenByUserNameQuery($userName: String!) {
    profile(userName: $userName) {
      ...ProfileScreen_profile
    }
  }
`;

ProfileMobileScreen.getScreenOptions = ({
  fromRectangle,
}: ProfileRoute['params']): ScreenOptions | null => {
  if (Platform.OS !== 'ios') {
    // TODO make it works on android
    return { stackAnimation: 'default' };
  }
  if (!fromRectangle) {
    return null;
  }
  const windowWidth = Dimensions.get('window').width;
  return {
    stackAnimation: 'custom',
    stackAnimationOptions: {
      animator: 'reveal',
      fromRectangle,
      toRectangle: {
        x: 0,
        y: 0,
        width: windowWidth,
        height: windowWidth / COVER_RATIO,
      },
      fromRadius: COVER_CARD_RADIUS * windowWidth,
      toRadius: 0,
    },
    transitionDuration: 220,
    customAnimationOnSwipe: true,
    gestureEnabled: true,
  };
};

export default relayScreen(ProfileMobileScreen, {
  query: getQuery,
  getVariables: ({ userName, profileID }) =>
    profileID ? { profileID } : { userName },
});
