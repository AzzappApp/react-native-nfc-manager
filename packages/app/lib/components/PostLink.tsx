import PressableScaleHighlight from '../ui/PressableScaleHighlight';
import Link from './Link';
import PostRenderer from './PostRenderer';
import type { PostRendererProps } from './PostRenderer';
import type { StyleProp, ViewStyle } from 'react-native';

const PostLink = ({
  postId,
  style,
  postRendererStyle,
  ...props
}: PostRendererProps & {
  postId: string;
  postRendererStyle?: StyleProp<ViewStyle>;
}) => {
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
