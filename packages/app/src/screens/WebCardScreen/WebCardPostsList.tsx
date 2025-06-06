import { memo } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { graphql } from 'react-relay';
import { useLazyLoadQuery } from 'react-relay/hooks';
import { useRouter } from '#components/NativeRouter';
import PostList from '#components/WebCardPostsList';
import { useProfileInfos } from '#hooks/authStateHooks';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { WebCardPostsListQuery } from '#relayArtifacts/WebCardPostsListQuery.graphql';

type WebCardPostsListProps = {
  webCardId: string;
  isViewer: boolean;
  hasFocus: boolean;
  userName: string;
  toggleFlip: () => void;
};

const WebCardPostsList = ({
  webCardId,
  isViewer,
  hasFocus,
  userName,
  toggleFlip,
}: WebCardPostsListProps) => {
  const intl = useIntl();

  const profileInfos = useProfileInfos();

  const { node } = useLazyLoadQuery<WebCardPostsListQuery>(
    graphql`
      query WebCardPostsListQuery($id: ID!, $viewerWebCardId: ID!) {
        node(id: $id) {
          ... on WebCard @alias(as: "webCard") {
            ...WebCardPostsList_webCard
              @arguments(viewerWebCardId: $viewerWebCardId)
            ...WebCardPostsList_author
          }
        }
      }
    `,
    { id: webCardId, viewerWebCardId: profileInfos?.webCardId ?? '' },
    { fetchPolicy: 'store-and-network' },
  );
  const webCard = node?.webCard;

  const router = useRouter();
  const onClose = () => {
    router.back();
  };

  const { top } = useScreenInsets();
  return (
    <Container style={[styles.container, { paddingTop: top }]}>
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
          webCard={node.webCard}
          author={node.webCard}
          canPlay={hasFocus}
          onPressAuthor={toggleFlip}
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default memo(WebCardPostsList);
