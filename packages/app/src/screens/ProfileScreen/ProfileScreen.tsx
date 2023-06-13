import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { useNativeNavigationEvent } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import ProfileScreenContent from './ProfileScreenContent';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ProfileRoute } from '#routes';
import type { ProfileScreenByIdQuery } from '@azzapp/relay/artifacts/ProfileScreenByIdQuery.graphql';
import type { ProfileScreenByUserNameQuery } from '@azzapp/relay/artifacts/ProfileScreenByUserNameQuery.graphql';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

/**
 * Display a profile Web card.
 */
const ProfileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<
  ProfileRoute,
  ProfileScreenByIdQuery | ProfileScreenByUserNameQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  const [ready, setReady] = useState(false);
  useNativeNavigationEvent('appear', () => {
    setReady(true);
  });

  const prefetchRoute = usePrefetchRoute();
  useEffect(() => {
    const { viewer, profile } = data;
    if (
      viewer?.profile?.id &&
      profile?.id &&
      viewer.profile.id === profile.id
    ) {
      const modules: Array<ModuleKind | 'cover'> = ['cover', ...MODULE_KINDS];
      modules.forEach(module => {
        prefetchRoute({
          route: 'CARD_MODULE_EDITION',
          params: { module },
        });
      });
    }
  }, [data, prefetchRoute]);

  if (!data.profile) {
    return null;
  }

  return (
    <ProfileScreenContent
      ready={ready}
      profile={data.profile}
      userProfileId={data.viewer.profile?.id ?? ''}
    />
  );
};

const getQuery = (params: ProfileRoute['params']) =>
  params.profileID ? profileScreenByIdQuery : profileScreenByNameQuery;

const profileScreenByIdQuery = graphql`
  query ProfileScreenByIdQuery($profileID: ID!) {
    profile: node(id: $profileID) {
      id
      ...ProfileScreenContent_profile
    }
    viewer {
      profile {
        id
      }
    }
  }
`;

const profileScreenByNameQuery = graphql`
  query ProfileScreenByUserNameQuery($userName: String!) {
    profile(userName: $userName) {
      id
      ...ProfileScreenContent_profile
    }
    viewer {
      profile {
        id
      }
    }
  }
`;

ProfileScreen.getScreenOptions = ({
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

export default relayScreen(ProfileScreen, {
  query: getQuery,
  getVariables: ({ userName, profileID }) =>
    profileID ? { profileID } : { userName },
});
