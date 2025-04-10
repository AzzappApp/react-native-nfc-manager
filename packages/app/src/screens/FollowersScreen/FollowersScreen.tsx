import { Suspense, useState } from 'react';
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
import SearchBar from '#ui/SearchBar';
import FollowersScreenList from './FollowersScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowersScreenQuery } from '#relayArtifacts/FollowersScreenQuery.graphql';
import type { FollowersRoute } from '#routes';

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
  const { webCard } = usePreloadedQuery(followersScreenQuery, preloadedQuery);
  const [searchValue, setSearchValue] = useState<string | undefined>('');
  const router = useRouter();
  const { top } = useScreenInsets();

  return (
    <Container style={[styles.container, { paddingTop: top }]}>
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
      <View style={styles.header}>
        <SearchBar onChangeText={setSearchValue} value={searchValue} />
      </View>
      <Suspense fallback={<LoadingView />}>
        <FollowersScreenList
          isPublic={!webCard?.cardIsPrivate}
          currentWebCardId={webCard?.id ?? ''}
          webCard={webCard ?? null}
          searchValue={searchValue}
        />
      </Suspense>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: {
    borderWidth: 0,
  },
  header: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
});

export default relayScreen(FollowersScreen, {
  query: followersScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
  }),
});
