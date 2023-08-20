import { useIntl } from 'react-intl';
import { SafeAreaView } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import FollowingsMosaicScreenList from './FollowingsMosaicScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowingsRoute } from '#routes';
import type { FollowingsMosaicScreenQuery } from '@azzapp/relay/artifacts/FollowingsMosaicScreenQuery.graphql';

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
  const { viewer } = usePreloadedQuery(
    followingsMosaicScreenQuery,
    preloadedQuery,
  );

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
        <FollowingsMosaicScreenList viewer={viewer} />
      </Container>
    </SafeAreaView>
  );
};

export default relayScreen(FollowingsMosaicScreen, {
  query: followingsMosaicScreenQuery,
});
