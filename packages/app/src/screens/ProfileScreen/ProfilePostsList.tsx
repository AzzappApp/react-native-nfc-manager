import { useIntl } from 'react-intl';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from '#components/NativeRouter';
import PostList from '#components/ProfilePostsList';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { PostRendererFragment_author$key } from '@azzapp/relay/artifacts/PostRendererFragment_author.graphql';
import type { ProfilePostsList_profile$key } from '@azzapp/relay/artifacts/ProfilePostsList_profile.graphql';

type ProfilePostsListProps = {
  profile: PostRendererFragment_author$key & ProfilePostsList_profile$key;
  isViewer: boolean;
  hasFocus: boolean;
  userName: string;
};

const ProfilePostsList = ({
  profile,
  isViewer,
  hasFocus,
  userName,
}: ProfilePostsListProps) => {
  const intl = useIntl();

  const router = useRouter();
  const onClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header
        middleElement={
          isViewer
            ? intl.formatMessage({
                defaultMessage: 'My posts',
                description: 'ProfilePostScreen viewer user title Header',
              })
            : intl.formatMessage(
                {
                  defaultMessage: '{userName} posts',
                  description: 'ProfilePostScreen title Header',
                },
                { userName },
              )
        }
        leftElement={
          <IconButton
            icon="arrow_down"
            onPress={onClose}
            iconSize={30}
            size={47}
            variant="icon"
          />
        }
      />
      <PostList profile={profile} canPlay={hasFocus} />
    </SafeAreaView>
  );
};

export default ProfilePostsList;
