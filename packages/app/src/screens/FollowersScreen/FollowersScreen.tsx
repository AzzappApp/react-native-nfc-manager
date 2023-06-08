import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import FollowersScreenList from './FollowersScreenList';
import type { FollowersScreen_viewer$key } from '@azzapp/relay/artifacts/FollowersScreen_viewer.graphql';

type FollowersScreenProps = {
  viewer: FollowersScreen_viewer$key;
};

const FollowersScreen = ({ viewer: viewerKey }: FollowersScreenProps) => {
  const intl = useIntl();

  const viewer = useFragment(
    graphql`
      fragment FollowersScreen_viewer on Viewer {
        profile {
          id
          public
        }
        ...FollowersScreenList_viewer
      }
    `,
    viewerKey,
  );

  const router = useRouter();

  return (
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
  );
};

const styles = StyleSheet.create({
  back: {
    borderWidth: 0,
  },
});

export default FollowersScreen;
