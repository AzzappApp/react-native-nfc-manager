import { useRef } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from '../PlatformEnvironment';
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
    const cover = postRef.current;
    const mediaRenderer = cover?.getCurrentMediaRenderer();
    if (!cover || !mediaRenderer) {
      router.push({
        route: 'POST',
        params: { postId },
      });
      return;
    }
    (mediaRenderer as any as NativeMethods).measureInWindow(
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
    <Pressable
      onPress={onPress}
      ref={ref}
      style={style}
      accessibilityRole="link"
    >
      {({ pressed }) => (
        <PostRenderer
          {...props}
          ref={postRef}
          style={[postRendererStyle, pressed && { opacity: 0.8 }]}
          paused={pressed ? true : props.paused}
        />
      )}
    </Pressable>
  );
};

export default PostLink;
