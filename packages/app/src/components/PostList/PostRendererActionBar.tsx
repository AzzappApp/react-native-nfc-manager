import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet, Share } from 'react-native';

import { useMutation, graphql, useFragment } from 'react-relay';

import { useDebounce } from 'use-debounce';
import { useRouter } from '#components/NativeRouter';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type {
  PostRendererActionBar_post$key,
  ReactionKind,
} from '@azzapp/relay/artifacts/PostRendererActionBar_post.graphql';

import type { ViewProps } from 'react-native';
export type PostRendererActionBarProps = ViewProps & {
  postKey: PostRendererActionBar_post$key;
};

const PostRendererActionBar = ({
  postKey,
  style,
  ...props
}: PostRendererActionBarProps) => {
  const router = useRouter();
  const intl = useIntl();
  const {
    viewerPostReaction,
    id: postId,
    allowLikes,
    allowComments,
    counterReactions,
  } = useFragment(
    graphql`
      fragment PostRendererActionBar_post on Post {
        id
        viewerPostReaction
        allowComments
        allowLikes
        counterReactions
      }
    `,
    postKey,
  );

  const [commit] = useMutation(
    graphql`
      mutation PostRendererActionBarReactionMutation(
        $input: TogglePostReactionInput!
      ) {
        togglePostReaction(input: $input) {
          post {
            id
            viewerPostReaction
            counterReactions
          }
        }
      }
    `,
  );

  const [reaction, setReaction] = useState<ReactionKind | null>(
    viewerPostReaction,
  );

  const [countReactions, setCountReactions] =
    useState<number>(counterReactions);

  // toggle the value locally
  const toggleReaction = () => {
    if (reaction) {
      setCountReactions(countReactions - 1);
      setReaction(null);
    } else {
      setCountReactions(countReactions + 1);
      setReaction('like');
    }
  };

  //refresh the value based on the GraphQL response
  useEffect(() => {
    setReaction(viewerPostReaction);
  }, [viewerPostReaction]);

  useEffect(() => {
    setCountReactions(counterReactions);
  }, [counterReactions]);

  const [valueReaction] = useDebounce(reaction, 600);

  useEffect(() => {
    if (valueReaction !== viewerPostReaction) {
      commit({
        variables: {
          input: {
            postId,
            reactionKind: 'like',
          },
        },
        optimisticResponse: {
          togglePostReaction: {
            post: {
              id: postId,
              viewerPostReaction: reaction,
              counterReactions: countReactions,
            },
          },
        },
      });
    }
  }, [
    commit,
    countReactions,
    counterReactions,
    postId,
    reaction,
    valueReaction,
    viewerPostReaction,
  ]);

  const goToComments = () => {
    router.push({ route: 'POST_COMMENTS', params: { postId } });
  };

  const onShare = async () => {
    // a quick share method using the native share component. If we want to make a custom share (like tiktok for example, when they are recompressiong the media etc) we can use react-native-shares
    try {
      await Share.share({
        message: 'Azzapp | An app made for your business',
      });
      //TODO: handle result of the share when specified
    } catch (error: any) {
      //TODO error
      console.log(error.message);
    }
  };

  return (
    <View {...props} style={[styles.container, style]}>
      <View style={{ flexDirection: 'row' }}>
        {allowLikes && (
          <IconButton
            //TODO create an animation for the like button later ? design team
            icon={reaction ? 'like_filled' : 'like'}
            style={styles.icon}
            onPress={toggleReaction}
            variant="icon"
            accessibilityState={{ checked: !!reaction }}
            accessibilityLabel={
              reaction
                ? intl.formatMessage({
                    defaultMessage: 'Like the post',
                    description:
                      'PostRendererActionBar like button accessibility',
                  })
                : intl.formatMessage({
                    defaultMessage: 'Unlike the post',
                    description:
                      'PostRendererActionBar unlike button accessibility',
                  })
            }
          />
        )}
        {allowComments && (
          <IconButton
            icon="comment"
            style={styles.icon}
            onPress={goToComments}
            variant="icon"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Comment the post',
              description:
                'PostRendererActionBar Comment post button accessibility',
            })}
          />
        )}
        <IconButton
          icon="share"
          style={styles.icon}
          variant="icon"
          onPress={onShare}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Share the post',
            description:
              'PostRendererActionBar Share post button accessibility',
          })}
        />
      </View>
      {allowLikes && (
        <Text variant="smallbold">
          <FormattedMessage
            defaultMessage="{countReactions} likes"
            description="PastRendererActionBar - Like Counter"
            values={{ countReactions }}
          />
        </Text>
      )}
    </View>
  );
};

export default PostRendererActionBar;

export const PostRendererActionBarSkeleton = () => {
  return (
    <View style={[styles.container, { marginTop: 10 }]}>
      <View style={{ flexDirection: 'row' }}>
        <IconButton icon={'like'} style={styles.icon} variant="icon" />
        <Icon icon="comment" style={styles.icon} />
        <Icon icon="share" style={styles.icon} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 36,
    witdh: '100%',
  },
  icon: {
    marginRight: 20,
  },
});
