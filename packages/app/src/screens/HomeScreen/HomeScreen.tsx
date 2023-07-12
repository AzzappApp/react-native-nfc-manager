import { Suspense, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import relayScreen from '#helpers/relayScreen';
import HomeScreenContent, { homeScreenQuery } from './HomeScreenContent';
import HomeScreenFallback from './HomeScreenFallback';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { HomeRoute } from '#routes';
import type { HomeScreenContentQuery } from '@azzapp/relay/artifacts/HomeScreenContentQuery.graphql';

const HomeScreen = (
  props: RelayScreenProps<HomeRoute, HomeScreenContentQuery>,
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
        <HomeScreenContent {...props} onReady={onReady} onLoaded={onLoaded} />
      </Suspense>
      {/** We wait for the home image to be ready for display before displaying the home screen */}
      {!ready && <HomeScreenFallback style={StyleSheet.absoluteFill} />}
    </View>
  );
};

export default relayScreen(HomeScreen, {
  query: homeScreenQuery,
  fallback: HomeScreenFallback,
});

//7 second was really to long, we need a timeout that the user can't feel
const READY_TIMEOUT = 1000;
