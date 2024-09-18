import { Suspense } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import SafeAreaView from '#ui/SafeAreaView';
import FollowersScreenList from './FollowersScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowersScreenQuery } from '#relayArtifacts/FollowersScreenQuery.graphql';
import type { FollowersRoute } from '#routes';
import type { PreloadedQuery } from 'react-relay';

const followersScreenQuery = graphql`
  query FollowersScreenQuery($webCardId: ID!) {
    webCard: node(id: $webCardId) {
      ... on WebCard {
        id
        cardIsPrivate
        ...FollowersScreenList_webCard
      }
    }
  }
`;

const FollowersScreen = ({
  preloadedQuery,
}: RelayScreenProps<FollowersRoute, FollowersScreenQuery>) => {
  const intl = useIntl();

  const router = useRouter();

  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          leftElement={
            <IconButton
              icon="arrow_left"
              iconSize={28}
              onPress={router.back}
              style={styles.back}
            />
          }
          middleElement={intl.formatMessage({
            defaultMessage: 'Followers',
            description: 'Title of the screen listing followers',
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
          <FollowerScreenInner preloadedQuery={preloadedQuery} />
        </Suspense>
      </SafeAreaView>
    </Container>
  );
};

const FollowerScreenInner = ({
  preloadedQuery,
}: {
  preloadedQuery: PreloadedQuery<FollowersScreenQuery>;
}) => {
  const { webCard } = usePreloadedQuery(followersScreenQuery, preloadedQuery);

  return (
    <FollowersScreenList
      isPublic={!webCard?.cardIsPrivate}
      currentWebCardId={webCard?.id ?? ''}
      webCard={webCard ?? null}
    />
  );
};

const styles = StyleSheet.create({
  back: {
    borderWidth: 0,
  },
});

export default relayScreen(FollowersScreen, {
  query: followersScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
  }),
});
