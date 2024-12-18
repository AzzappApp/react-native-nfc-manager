import { Suspense } from 'react';
import { useIntl } from 'react-intl';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import LoadingView from '#ui/LoadingView';
import SafeAreaView from '#ui/SafeAreaView';
import FollowingsScreenList from './FollowingsScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowingsScreenQuery } from '#relayArtifacts/FollowingsScreenQuery.graphql';
import type { FollowingsRoute } from '#routes';
import type { PreloadedQuery } from 'react-relay';

const followingsScreenQuery = graphql`
  query FollowingsScreenQuery($webCardId: ID!) {
    webCard: node(id: $webCardId) {
      id
      ...FollowingsScreenList_webCard
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
        <Suspense fallback={<LoadingView />}>
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
  const { webCard } = usePreloadedQuery(followingsScreenQuery, preloadedQuery);

  return <FollowingsScreenList webCard={webCard ?? null} />;
};
export default relayScreen(FollowingsScreen, {
  query: followingsScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
  }),
});
