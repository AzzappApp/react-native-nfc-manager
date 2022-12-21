import { useRef } from 'react';
import { useRouter } from '../PlatformEnvironment';
import PressableScaleHighlight from '../ui/PressableScaleHighlight';
import PostRenderer from './PostRenderer';
import type { PostRendererHandle, PostRendererProps } from './PostRenderer';
import type { StyleProp, ViewStyle, View, NativeMethods } from 'react-native';

const PostLink = ({
  postId,
  style,
  postRendererStyle,
  ...props
}: PostRendererProps & {
  postId: string;
  postRendererStyle?: StyleProp<ViewStyle>;
}) => {
  const postRef = useRef<PostRendererHandle | null>(null);
  const ref = useRef<View | null>(null);

  const router = useRouter();
  const onPress = () => {
    const container = ref.current;
    const post = postRef.current;
    if (!post || !container) {
      router.push({
        route: 'POST',
        params: { postId },
      });
      return;
    }
    (container as any as NativeMethods).measureInWindow(
      async (x, y, width, height) => {
        await postRef.current?.snapshot();
        const videoTime = await postRef.current?.getCurrentVideoTime();
        router.push({
          route: 'POST',
          params: {
            postId,
            videoTime,
            fromRectangle: { x, y, width, height },
          },
        });
      },
    );
  };

  return (
    <PressableScaleHighlight
      onPress={onPress}
      ref={ref}
      accessibilityRole="link"
      style={[style, { borderRadius: 16, overflow: 'hidden' }]}
    >
      {({ pressed }) => (
        <PostRenderer
          {...props}
          ref={postRef}
          style={postRendererStyle}
          paused={pressed ? true : props.paused}
        />
      )}
    </PressableScaleHighlight>
  );
};

export default PostLink;
