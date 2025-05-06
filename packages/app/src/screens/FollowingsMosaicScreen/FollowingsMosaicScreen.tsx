import { Suspense } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import LoadingView from '#ui/LoadingView';
import FollowingsMosaicScreenList from './FollowingsMosaicScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowingsMosaicScreenQuery } from '#relayArtifacts/FollowingsMosaicScreenQuery.graphql';
import type { FollowingsRoute } from '#routes';
import type { PreloadedQuery } from 'react-relay';

const followingsMosaicScreenQuery = graphql`
  query FollowingsMosaicScreenQuery($webCardId: ID!) {
    node(id: $webCardId) {
      ... on WebCard @alias(as: "webCard") {
        ...FollowingsMosaicScreenList_webCard
      }
    }
  }
`;

const FollowingsMosaicScreen = ({
  preloadedQuery,
}: RelayScreenProps<FollowingsRoute, FollowingsMosaicScreenQuery>) => {
  const router = useRouter();
  const intl = useIntl();

  const { top } = useScreenInsets();
  return (
    <Container style={styles.flex}>
      <View style={[styles.flex, { paddingTop: top }]}>
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
          <FollowingsMosaicScreenInner preloadedQuery={preloadedQuery} />
        </Suspense>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

const FollowingsMosaicScreenInner = ({
  preloadedQuery,
}: {
  preloadedQuery: PreloadedQuery<FollowingsMosaicScreenQuery>;
}) => {
  const { node } = usePreloadedQuery(
    followingsMosaicScreenQuery,
    preloadedQuery,
  );
  const webCard = node?.webCard;

  return <FollowingsMosaicScreenList webCard={webCard ?? null} />;
};

export default relayScreen(FollowingsMosaicScreen, {
  query: followingsMosaicScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
  }),
});
