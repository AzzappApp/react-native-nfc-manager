import { memo } from 'react';
import { useIntl } from 'react-intl';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from '#components/NativeRouter';
import PostList from '#components/WebCardPostsList';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { PostRendererFragment_author$key } from '#relayArtifacts/PostRendererFragment_author.graphql';
import type { WebCardPostsList_webCard$key } from '#relayArtifacts/WebCardPostsList_webCard.graphql';

type WebCardPostsListProps = {
  webCard: PostRendererFragment_author$key & WebCardPostsList_webCard$key;
  isViewer: boolean;
  hasFocus: boolean;
  userName: string;
  toggleFlip: () => void;
};

const WebCardPostsList = ({
  webCard,
  isViewer,
  hasFocus,
  userName,
  toggleFlip,
}: WebCardPostsListProps) => {
  const intl = useIntl();

  const router = useRouter();
  const onClose = () => {
    router.back();
  };

  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1 }}
        edges={{ bottom: 'off', top: 'additive' }}
      >
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
        <PostList
          webCard={webCard}
          canPlay={hasFocus}
          onPressAuthor={toggleFlip}
        />
      </SafeAreaView>
    </Container>
  );
};

export default memo(WebCardPostsList);
