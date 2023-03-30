import { useCallback } from 'react';
import { graphql, usePreloadedQuery } from 'react-relay';
import { mainRoutes } from '#mobileRoutes';
import { useRouter } from '#PlatformEnvironment';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import relayScreen from '#helpers/relayScreen';
import NewProfileScreen from '#screens/NewProfileScreen/NewProfileScreen';
import type { NativeRouter } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { NewProfileRoute } from '#routes';
import type { NewProfileMobileScreenQuery } from '@azzapp/relay/artifacts/NewProfileMobileScreenQuery.graphql';

const newProfileScreenQuery = graphql`
  query NewProfileMobileScreenQuery {
    viewer {
      ...NewProfileScreen_viewer
    }
  }
`;

const NewProfileMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<NewProfileRoute, NewProfileMobileScreenQuery>) => {
  const { viewer } = usePreloadedQuery(newProfileScreenQuery, preloadedQuery);

  const onProfileCreated = ({
    token,
    refreshToken,
    profileId,
  }: {
    token: string;
    refreshToken: string;
    profileId: string;
  }) => {
    dispatchGlobalEvent({
      type: 'PROFILE_CHANGE',
      payload: {
        authTokens: {
          token,
          refreshToken,
        },
        profileId,
      },
    });
  };

  const nativeRouter = useRouter() as NativeRouter;

  const onClose = useCallback(() => {
    nativeRouter.replaceAll(mainRoutes);
  }, [nativeRouter]);

  return (
    <NewProfileScreen
      viewer={viewer}
      onProfileCreated={onProfileCreated}
      onClose={onClose}
    />
  );
};

NewProfileMobileScreen.options = {
  replaceAnimation: 'push',
};
export default relayScreen(NewProfileMobileScreen, {
  query: newProfileScreenQuery,
});
