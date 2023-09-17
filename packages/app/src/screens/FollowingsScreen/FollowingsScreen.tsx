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
import FollowingsScreenList from './FollowingsScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowingsRoute } from '#routes';
import type { FollowingsScreenQuery } from '@azzapp/relay/artifacts/FollowingsScreenQuery.graphql';
import type { PreloadedQuery } from 'react-relay';

const followingsScreenQuery = graphql`
  query FollowingsScreenQuery {
    viewer {
      profile {
        id
      }
      ...FollowingsScreenList_viewer
    }
  }
`;

const FollowingsScreen = ({
  preloadedQuery,
}: RelayScreenProps<FollowingsRoute, FollowingsScreenQuery>) => {
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
          <FollowingScreenInner preloadedQuery={preloadedQuery} />
        </Suspense>
      </SafeAreaView>
    </Container>
  );
};

const FollowingScreenInner = ({
  preloadedQuery,
}: {
  preloadedQuery: PreloadedQuery<FollowingsScreenQuery>;
}) => {
  const { viewer } = usePreloadedQuery(followingsScreenQuery, preloadedQuery);

  return (
    <FollowingsScreenList
      currentProfileId={viewer.profile?.id ?? ''}
      viewer={viewer}
    />
  );
};
export default relayScreen(FollowingsScreen, {
  query: followingsScreenQuery,
});
