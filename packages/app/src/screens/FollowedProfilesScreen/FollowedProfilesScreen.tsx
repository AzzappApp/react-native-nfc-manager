import { useIntl } from 'react-intl';
import { SafeAreaView } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import FollowedProfilesScreenList from './FollowedProfilesScreenList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowedProfilesRoute } from '#routes';
import type { FollowedProfilesScreenQuery } from '@azzapp/relay/artifacts/FollowedProfilesScreenQuery.graphql';

const followedProfilesScreenQuery = graphql`
  query FollowedProfilesScreenQuery {
    viewer {
      profile {
        id
      }
      ...FollowedProfilesScreenList_viewer
    }
  }
`;

const FollowedProfilesScreen = ({
  preloadedQuery,
}: RelayScreenProps<FollowedProfilesRoute, FollowedProfilesScreenQuery>) => {
  const { viewer } = usePreloadedQuery(
    followedProfilesScreenQuery,
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
        <FollowedProfilesScreenList
          currentProfileId={viewer.profile?.id ?? ''}
          viewer={viewer}
        />
      </Container>
    </SafeAreaView>
  );
};

export default relayScreen(FollowedProfilesScreen, {
  query: followedProfilesScreenQuery,
});
