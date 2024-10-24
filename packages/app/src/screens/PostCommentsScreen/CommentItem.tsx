import { memo } from 'react';
import { FormattedRelativeTime, useIntl } from 'react-intl';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { profileHasEditorRight } from '@azzapp/shared/profileHelpers';
import { colors } from '#theme';
import AuthorCartouche from '#components/AuthorCartouche';
import Link from '#components/Link';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { relativeDateMinute } from '#helpers/dateHelpers';
import { useProfileInfos } from '#hooks/authStateHooks';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';

import type { CommentItemFragment_comment$key } from '#relayArtifacts/CommentItemFragment_comment.graphql';

type CommentItemProps = {
  item: CommentItemFragment_comment$key;
};

const CommentItem = ({ item }: CommentItemProps) => {
  const intl = useIntl();
  const postComment = useFragment(
    graphql`
      fragment CommentItemFragment_comment on PostComment {
        id
        comment
        createdAt
        webCard {
          id
          userName
          cardIsPublished
          ...AuthorCartoucheFragment_webCard
        }
      }
    `,
    item,
  );

  const styles = useStyleSheet(styleSheet);
  const profileInfos = useProfileInfos();

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
        <View style={{ flexDirection: 'row' }}>
          <Text variant="small">
            {postComment.webCard.cardIsPublished ||
            (profileHasEditorRight(profileInfos?.profileRole) &&
              profileInfos?.webCardId === postComment.webCard.id) ? (
              <Link
                route="WEBCARD"
                params={{ userName: postComment.webCard.userName }}
              >
                <Text variant="smallbold">{postComment.webCard.userName} </Text>
              </Link>
            ) : (
              <PressableNative
                onPress={() =>
                  Toast.show({
                    type: 'error',
                    text1: intl.formatMessage({
                      defaultMessage: 'Oops, this WebCard could not be found.',
                      description:
                        'Comment Item - Error message toast when accessing an unpublished webcard',
                    }) as string,
                  })
                }
              >
                <Text variant="smallbold">{postComment.webCard.userName} </Text>
              </PressableNative>
            )}
            {postComment.comment.trim()}
          </Text>
        </View>
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
