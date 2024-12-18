import { useRef } from 'react';
import { useRouter } from '#components/NativeRouter';
import PostRendererFeed from '#components/PostList/PostRendererFeed';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import type { PostRendererFeedHandle } from '#components/PostList/PostRendererFeed';
import type { PostLinkProps } from './postLinkTypes';
import type { View, NativeMethods } from 'react-native';

/**
 * iOS version of the post link, it dispatches a push to the posts screen with
 * the native reveal animation
 */
const PostLink = ({
  postId,
  style,
  postRendererStyle,
  onLike,
  ...props
}: PostLinkProps) => {
  const postRef = useRef<PostRendererFeedHandle | null>(null);
  const ref = useRef<View | null>(null);

  const router = useRouter();
  const onPress = () => {
    const container = ref.current;
    const post = postRef.current;
    if (!post || !container) {
      router.push({
        route: 'POST',
        id: postId,
        params: { postId },
      });
      return;
    }
    (container as NativeMethods).measureInWindow(
      async (x, y, width, height) => {
        await postRef.current?.snapshot();
        const videoTime = await postRef.current?.getCurrentVideoTime();
        router.push({
          route: 'POST',
          id: postId, //we set an id to avoid double opening due to video time change
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
      onDoublePress={onLike}
      ref={ref}
      accessibilityRole="link"
      style={[style, { borderRadius: 16, overflow: 'hidden' }]}
    >
      {({ pressed }) => (
        <PostRendererFeed
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
