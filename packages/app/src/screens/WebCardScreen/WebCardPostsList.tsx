import { memo } from 'react';
import { useIntl } from 'react-intl';
import { graphql } from 'react-relay';
import { useLazyLoadQuery } from 'react-relay/hooks';
import { useRouter } from '#components/NativeRouter';
import PostList from '#components/WebCardPostsList';
import { useProfileInfos } from '#hooks/authStateHooks';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import SafeAreaView from '#ui/SafeAreaView';
import type { PostList_viewerWebCard$key } from '#relayArtifacts/PostList_viewerWebCard.graphql';
import type { WebCardPostsListQuery } from '#relayArtifacts/WebCardPostsListQuery.graphql';

type WebCardPostsListProps = {
  webCardId: string;
  isViewer: boolean;
  hasFocus: boolean;
  userName: string;
  toggleFlip: () => void;
  viewerWebCard: PostList_viewerWebCard$key;
};

const WebCardPostsList = ({
  viewerWebCard,
  webCardId,
  isViewer,
  hasFocus,
  userName,
  toggleFlip,
}: WebCardPostsListProps) => {
  const intl = useIntl();

  const profileInfos = useProfileInfos();

  const { webCard } = useLazyLoadQuery<WebCardPostsListQuery>(
    graphql`
      query WebCardPostsListQuery($id: ID!, $viewerWebCardId: ID!) {
        webCard: node(id: $id) {
          ... on WebCard {
            ...WebCardPostsList_webCard
              @arguments(viewerWebCardId: $viewerWebCardId)
            ...PostRendererFragment_author
            ...PostList_author
          }
        }
      }
    `,
    { id: webCardId, viewerWebCardId: profileInfos?.webCardId ?? '' },
    { fetchPolicy: 'store-and-network' },
  );

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
        {webCard && (
          <PostList
            webCard={webCard}
            viewerWebCard={viewerWebCard}
            canPlay={hasFocus}
            onPressAuthor={toggleFlip}
          />
        )}
      </SafeAreaView>
    </Container>
  );
};

export default memo(WebCardPostsList);
