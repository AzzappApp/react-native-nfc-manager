import { Text, useWindowDimensions, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '../../theme';
import Link from './Link';
import MediaRenderer from './MediaRenderer';
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
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
      ) {
        id
        media {
          ...MediaRendererFragment_media @arguments(width: $screenWidth)
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
      <MediaRenderer
        media={post.media}
        width={windowWidth}
        repeat
        style={{ backgroundColor: colors.lightGrey }}
      />
      <View style={{ padding: 20 }}>
        <Link route="USER" params={{ userName: author.userName }}>
          <Text>{author.userName}</Text>
        </Link>
        <Text style={{ marginVertical: 10 }}>{post.content}</Text>
      </View>
    </View>
  );
};

export default PostRenderer;
