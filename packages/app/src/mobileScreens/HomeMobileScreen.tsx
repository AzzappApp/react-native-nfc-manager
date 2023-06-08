import { Suspense, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import HomeScreen, { HomeScreenFallback } from '#screens/HomeScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { HomeRoute } from '#routes';
import type { HomeMobileScreenQuery } from '@azzapp/relay/artifacts/HomeMobileScreenQuery.graphql';

const homeScreenQuery = graphql`
  query HomeMobileScreenQuery {
    viewer {
      ...HomeScreen_viewer
    }
  }
`;

const HomeMobileScreen = (
  props: RelayScreenProps<HomeRoute, HomeMobileScreenQuery>,
) => {
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const onLoaded = useCallback(() => {
    setLoaded(true);
  }, []);

  const onReady = useCallback(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      setTimeout(() => {
        // In case of slow connexion, we don't want to show the fallback for too long
        setReady(true);
      }, READY_TIMEOUT);
    }
  }, [loaded]);

  return (
    <View style={{ flex: 1 }}>
      <Suspense>
        <HomeMobileScreenInner
          {...props}
          onReady={onReady}
          onLoaded={onLoaded}
        />
      </Suspense>
      {/** We wait for the home image to be ready for display before displaying the home screen */}
      {!ready && <HomeScreenFallback style={StyleSheet.absoluteFill} />}
    </View>
  );
};

export default relayScreen(HomeMobileScreen, {
  query: homeScreenQuery,
  fallback: HomeScreenFallback,
});

const READY_TIMEOUT = 7000;

const HomeMobileScreenInner = ({
  preloadedQuery,
  hasFocus,
  onReady,
  onLoaded,
}: RelayScreenProps<HomeRoute, HomeMobileScreenQuery> & {
  onReady: () => void;
  onLoaded: () => void;
}) => {
  const data = usePreloadedQuery(homeScreenQuery, preloadedQuery);
  useEffect(() => {
    // the usePreloadedQuery hook will suspend until the query is ready
    onLoaded?.();
  }, [onLoaded]);

  return (
    <HomeScreen viewer={data.viewer} hasFocus={hasFocus} onReady={onReady} />
  );
};
