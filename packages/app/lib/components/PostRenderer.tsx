import { Image, Text, useWindowDimensions, View } from 'react-native';
import Video from 'react-native-video';
import { graphql, useFragment } from 'react-relay';
import { colors } from '../../theme';
import Link from './Link';
import type { PostRendererFragment_author$key } from '@azzapp/relay/artifacts/PostRendererFragment_author.graphql';
import type { PostRendererFragment_post$key } from '@azzapp/relay/artifacts/PostRendererFragment_post.graphql';
import type { ViewProps } from 'react-native';
type PostScreenProps = ViewProps & {
  post: PostRendererFragment_post$key;
  author: PostRendererFragment_author$key;
};

const PostRenderer = ({
  post: postKey,
  author: authorKey,
  ...props
}: PostScreenProps) => {
  const post = useFragment(
    graphql`
      fragment PostRendererFragment_post on Post
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
      ) {
        id
        media {
          kind
          ratio
          uri(width: $screenWidth, pixelRatio: $pixelRatio)
        }
        content
      }
    `,
    postKey,
  );

  const author = useFragment(
    graphql`
      fragment PostRendererFragment_author on User {
        id
        userName
      }
    `,
    authorKey,
  );

  const { width: windowWidth } = useWindowDimensions();

  return (
    <View {...props}>
      {post.media.kind === 'picture' ? (
        <Image
          source={{ uri: post.media.uri }}
          style={{
            width: windowWidth,
            height: windowWidth / post.media.ratio,
            backgroundColor: colors.lightGrey,
          }}
        />
      ) : (
        <Video
          source={{ uri: post.media.uri }}
          allowsExternalPlayback={false}
          hideShutterView
          playWhenInactive
          repeat
          resizeMode="cover"
          style={{
            width: windowWidth,
            height: windowWidth / post.media.ratio,
            backgroundColor: colors.lightGrey,
          }}
        />
      )}
      <View style={{ padding: 20 }}>
        <Link route="USER" params={{ userId: author.id }}>
          <Text>{author.userName}</Text>
        </Link>
        <Text style={{ marginVertical: 10 }}>{post.content}</Text>
      </View>
    </View>
  );
};

export default PostRenderer;
