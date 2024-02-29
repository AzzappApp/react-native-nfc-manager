import { Suspense } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import SafeAreaView from '#ui/SafeAreaView';
import FollowingsMosaicScreenList from './FollowingsMosaicScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowingsMosaicScreenQuery } from '#relayArtifacts/FollowingsMosaicScreenQuery.graphql';
import type { FollowingsRoute } from '#routes';
import type { PreloadedQuery } from 'react-relay';

const followingsMosaicScreenQuery = graphql`
  query FollowingsMosaicScreenQuery($webCardId: ID!) {
    webCard: node(id: $webCardId) {
      ...FollowingsMosaicScreenList_webCard
    }
  }
`;

const FollowingsMosaicScreen = ({
  preloadedQuery,
}: RelayScreenProps<FollowingsRoute, FollowingsMosaicScreenQuery>) => {
  const router = useRouter();
  const intl = useIntl();

  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          leftElement={
            <IconButton
              icon="arrow_left"
              iconSize={28}
              onPress={router.back}
              variant="icon"
            />
          }
          middleElement={intl.formatMessage({
            defaultMessage: 'Following',
            description: 'Title of the screen listing followed profiles',
          })}
        />
        <Suspense
          fallback={
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator />
            </View>
          }
        >
          <FollowingsMosaicScreenInner preloadedQuery={preloadedQuery} />
        </Suspense>
      </SafeAreaView>
    </Container>
  );
};

const FollowingsMosaicScreenInner = ({
  preloadedQuery,
}: {
  preloadedQuery: PreloadedQuery<FollowingsMosaicScreenQuery>;
}) => {
  const { webCard } = usePreloadedQuery(
    followingsMosaicScreenQuery,
    preloadedQuery,
  );

  return <FollowingsMosaicScreenList webCard={webCard ?? null} />;
};

export default relayScreen(FollowingsMosaicScreen, {
  query: followingsMosaicScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
  }),
});
