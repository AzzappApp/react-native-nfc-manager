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
import FollowingsScreenList from './FollowingsScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowingsScreenQuery } from '#relayArtifacts/FollowingsScreenQuery.graphql';
import type { FollowingsRoute } from '#routes';
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
  const [searchValue, setSearchValue] = useState<string | undefined>('');
  const { webCard } = usePreloadedQuery(followingsScreenQuery, preloadedQuery);
  const { top } = useScreenInsets();
  return (
    <Container style={[styles.container, { paddingTop: top }]}>
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
      <View style={styles.header}>
        <SearchBar onChangeText={setSearchValue} value={searchValue} />
      </View>
      <Suspense fallback={<LoadingView />}>
        <FollowingsScreenList webCard={webCard} searchValue={searchValue} />
      </Suspense>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
});

export default relayScreen(FollowingsScreen, {
  query: followingsScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
  }),
});
