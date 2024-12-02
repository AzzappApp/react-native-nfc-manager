import { StyleSheet } from 'react-native';
import PostRendererFeed from '#components/PostList/PostRendererFeed';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import Link from '../Link';
import type { PostLinkProps } from './postLinkTypes';

/**
 * A PostRenderer wrapped in a link to the post screen on ios,
 * triggers a reaveal animation when pressed
 */
const PostLink = ({
  onLike,
  postId,
  style,
  postRendererStyle,
  ...props
}: PostLinkProps) => {
  return (
    <Link route="POST" params={{ postId }}>
      <PressableScaleHighlight
        style={[style, styles.pressableStyle]}
        onDoublePress={onLike}
      >
        {({ pressed }) => (
          <PostRendererFeed
            {...props}
            style={postRendererStyle}
            paused={pressed ? true : props.paused}
          />
        )}
      </PressableScaleHighlight>
    </Link>
  );
};

export default PostLink;

const styles = StyleSheet.create({
  pressableStyle: { borderRadius: 16, overflow: 'hidden' },
});
