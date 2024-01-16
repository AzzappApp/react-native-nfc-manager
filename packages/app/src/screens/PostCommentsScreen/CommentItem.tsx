import { memo } from 'react';
import { FormattedRelativeTime } from 'react-intl';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import AuthorCartouche from '#components/AuthorCartouche';
import Link from '#components/Link';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { relativeDateMinute } from '#helpers/dateHelpers';
import Text from '#ui/Text';

import type { CommentItemFragment_comment$key } from '#relayArtifacts/CommentItemFragment_comment.graphql';

type CommentItemProps = {
  item: CommentItemFragment_comment$key;
};

const CommentItem = ({ item }: CommentItemProps) => {
  const postComment = useFragment(
    graphql`
      fragment CommentItemFragment_comment on PostComment {
        id
        comment
        createdAt
        webCard {
          id
          userName
          ...AuthorCartoucheFragment_webCard
        }
      }
    `,
    item,
  );

  const styles = useStyleSheet(styleSheet);

  if (!postComment) return null;

  return (
    <View style={styles.commentContainer}>
      <AuthorCartouche
        author={postComment.webCard}
        variant="post"
        hideUserName
        style={styles.commentCartouche}
        activeLink
      />
      <View style={{ flex: 1 }}>
        <Text variant="small">
          <Link
            route="WEBCARD"
            params={{ userName: postComment.webCard.userName }}
          >
            <Text variant="smallbold">{postComment.webCard.userName} </Text>
          </Link>
          {postComment.comment}
        </Text>
        <Text variant="small" style={styles.relativeTime}>
          <FormattedRelativeTime
            value={relativeDateMinute(postComment.createdAt)}
            numeric="auto"
            updateIntervalInSeconds={60}
          />
        </Text>
      </View>
    </View>
  );
};

export default memo(CommentItem);

const styleSheet = createStyleSheet(appearance => ({
  relativeTime: { color: colors.grey400, paddingTop: 5 },
  commentCartouche: { paddingTop: 0, paddingBottom: 0 },
  commentContainer: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 10,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: appearance === 'dark' ? colors.grey1000 : colors.grey50,
  },
}));
