import { useCallback } from 'react';
import { PixelRatio } from 'react-native';
import { fetchQuery, graphql, usePreloadedQuery } from 'react-relay';
import { Observable } from 'relay-runtime';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { mainRoutes } from '#mobileRoutes';
import { useRouter } from '#PlatformEnvironment';
import { prefetchImage } from '#components/medias';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import relayScreen from '#helpers/relayScreen';
import NewProfileScreen from '#screens/NewProfileScreen/NewProfileScreen';
import type { NativeRouter } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { NewProfileRoute } from '#routes';
import type { NewProfileMobileScreenPreloadQuery } from '@azzapp/relay/artifacts/NewProfileMobileScreenPreloadQuery.graphql';
import type { NewProfileMobileScreenQuery } from '@azzapp/relay/artifacts/NewProfileMobileScreenQuery.graphql';

const newProfileScreenQuery = graphql`
  query NewProfileMobileScreenQuery {
    ...NewProfileScreen_query
  }
`;

const NewProfileMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<NewProfileRoute, NewProfileMobileScreenQuery>) => {
  const data = usePreloadedQuery(newProfileScreenQuery, preloadedQuery);

  const onProfileCreated = ({
    token,
    refreshToken,
    profileId,
  }: {
    token: string;
    refreshToken: string;
    profileId: string;
  }) => {
    void dispatchGlobalEvent({
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
      data={data}
      onProfileCreated={onProfileCreated}
      onClose={onClose}
    />
  );
};

NewProfileMobileScreen.prefetch = () => {
  const environment = getRelayEnvironment();
  const pixelRatio = Math.min(2, PixelRatio.get());
  return fetchQuery<NewProfileMobileScreenPreloadQuery>(
    environment,
    graphql`
      query NewProfileMobileScreenPreloadQuery($pixelRatio: Float!) {
        ...NewProfileScreen_query
        profileCategories {
          id
          medias {
            preloadURI: uri(width: 300, pixelRatio: $pixelRatio)
          }
        }
      }
    `,
    { pixelRatio },
  ).mergeMap(({ profileCategories }) => {
    const observables = convertToNonNullArray(
      profileCategories.flatMap(category =>
        category.medias?.map(media => prefetchImage(media.preloadURI)),
      ),
    );
    if (observables.length === 0) {
      return Observable.from(null);
    }
    return combineLatest(observables);
  });
};

NewProfileMobileScreen.options = {
  replaceAnimation: 'push',
};

export default relayScreen(NewProfileMobileScreen, {
  query: newProfileScreenQuery,
});
