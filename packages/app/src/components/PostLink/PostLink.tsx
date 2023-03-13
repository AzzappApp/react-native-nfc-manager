import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import Link from '../Link';
import PostRenderer from '../PostRenderer';
import type { PostLinkProps } from './postLinkTypes';

/**
 * A PostRenderer wrapped in a link to the post screen on ios,
 * triggers a reaveal animation when pressed
 */
const PostLink = ({
  postId,
  style,
  postRendererStyle,
  ...props
}: PostLinkProps) => {
  return (
    <Link route="POST" params={{ postId }}>
      <PressableScaleHighlight
        style={[style, { borderRadius: 16, overflow: 'hidden' }]}
      >
        {({ pressed }) => (
          <PostRenderer
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
