import { useIntl } from 'react-intl';
import { SafeAreaView } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import FollowingsScreenList from './FollowingsScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowingsRoute } from '#routes';
import type { FollowingsScreenQuery } from '@azzapp/relay/artifacts/FollowingsScreenQuery.graphql';

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
  const { viewer } = usePreloadedQuery(followingsScreenQuery, preloadedQuery);

  const router = useRouter();
  const intl = useIntl();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Container style={{ flex: 1 }}>
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
        <FollowingsScreenList
          currentProfileId={viewer.profile?.id ?? ''}
          viewer={viewer}
        />
      </Container>
    </SafeAreaView>
  );
};

export default relayScreen(FollowingsScreen, {
  query: followingsScreenQuery,
});
