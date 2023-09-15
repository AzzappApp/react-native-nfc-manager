import { Suspense } from 'react';
import { useIntl } from 'react-intl';
import { SafeAreaView, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import FollowingsMosaicScreenList from './FollowingsMosaicScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowingsRoute } from '#routes';
import type { FollowingsMosaicScreenQuery } from '@azzapp/relay/artifacts/FollowingsMosaicScreenQuery.graphql';
import type { PreloadedQuery } from 'react-relay';

const followingsMosaicScreenQuery = graphql`
  query FollowingsMosaicScreenQuery {
    viewer {
      ...FollowingsMosaicScreenList_viewer
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
  const { viewer } = usePreloadedQuery(
    followingsMosaicScreenQuery,
    preloadedQuery,
  );

  return <FollowingsMosaicScreenList viewer={viewer} />;
};

export default relayScreen(FollowingsMosaicScreen, {
  query: followingsMosaicScreenQuery,
});
