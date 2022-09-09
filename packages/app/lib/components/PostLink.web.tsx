import { Pressable } from 'react-native';
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
      <Pressable style={style}>
        {({ pressed }) => (
          <PostRenderer
            {...props}
            style={[postRendererStyle, pressed && { opacity: 0.8 }]}
            paused={pressed ? true : props.paused}
          />
        )}
      </Pressable>
    </Link>
  );
};

export default PostLink;
