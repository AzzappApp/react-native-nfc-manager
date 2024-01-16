import { Suspense } from 'react';
import { useIntl } from 'react-intl';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import FollowersScreenList from './FollowersScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowersScreenQuery } from '#relayArtifacts/FollowersScreenQuery.graphql';
import type { FollowersRoute } from '#routes';
import type { PreloadedQuery } from 'react-relay';

const followersScreenQuery = graphql`
  query FollowersScreenQuery {
    viewer {
      profile {
        id
        webCard {
          id
          cardIsPrivate
          ...FollowersScreenList_webCard
        }
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
  const { viewer } = usePreloadedQuery(followersScreenQuery, preloadedQuery);

  return (
    <FollowersScreenList
      isPublic={!viewer?.profile?.webCard.cardIsPrivate ?? false}
      currentWebCardId={viewer.profile?.webCard?.id ?? ''}
      webCard={viewer.profile?.webCard ?? null}
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
});
