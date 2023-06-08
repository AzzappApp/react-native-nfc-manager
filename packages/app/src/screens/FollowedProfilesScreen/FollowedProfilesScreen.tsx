import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import FollowedProfilesScreenList from './FollowedProfilesScreenList';
import type { FollowedProfilesScreen_viewer$key } from '@azzapp/relay/artifacts/FollowedProfilesScreen_viewer.graphql';

type FollowedProfilesScreenProps = {
  viewer: FollowedProfilesScreen_viewer$key;
};

const FollowedProfilesScreen = ({
  viewer: viewerKey,
}: FollowedProfilesScreenProps) => {
  const intl = useIntl();

  const viewer = useFragment(
    graphql`
      fragment FollowedProfilesScreen_viewer on Viewer {
        profile {
          id
        }
        ...FollowedProfilesScreenList_viewer
      }
    `,
    viewerKey,
  );

  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
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
    </View>
  );
};

export default FollowedProfilesScreen;
