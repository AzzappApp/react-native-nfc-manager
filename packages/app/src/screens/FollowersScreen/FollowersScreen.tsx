import { useIntl } from 'react-intl';
import { SafeAreaView, StyleSheet } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import FollowersScreenList from './FollowersScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowersRoute } from '#routes';
import type { FollowersScreenQuery } from '@azzapp/relay/artifacts/FollowersScreenQuery.graphql';

const followersScreenQuery = graphql`
  query FollowersScreenQuery {
    viewer {
      profile {
        id
        public
      }
      ...FollowersScreenList_viewer
    }
  }
`;

const FollowersScreen = ({
  preloadedQuery,
}: RelayScreenProps<FollowersRoute, FollowersScreenQuery>) => {
  const intl = useIntl();

  const { viewer } = usePreloadedQuery(followersScreenQuery, preloadedQuery);

  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Container style={{ flex: 1 }}>
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
        <FollowersScreenList
          isPublic={viewer?.profile?.public ?? false}
          currentProfileId={viewer.profile?.id ?? ''}
          viewer={viewer}
        />
      </Container>
    </SafeAreaView>
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
