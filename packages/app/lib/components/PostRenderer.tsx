import { StyleSheet, Text, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors, fontFamilies } from '../../theme';
import AuthorCartouche from './AuthorCartouche';
import Link from './Link';
import MediaRenderer from './MediaRenderer';
import type { PostRendererFragment_author$key } from '@azzapp/relay/artifacts/PostRendererFragment_author.graphql';
import type { PostRendererFragment_post$key } from '@azzapp/relay/artifacts/PostRendererFragment_post.graphql';
import type { ViewProps } from 'react-native';

type PostScreenProps = ViewProps & {
  post: PostRendererFragment_post$key;
  author: PostRendererFragment_author$key;
  small?: boolean;
  width: number;
  muted?: boolean;
  paused?: boolean;
};

const PostRenderer = ({
  post: postKey,
  author: authorKey,
  width,
  small,
  muted = false,
  paused = false,
  ...props
}: PostScreenProps) => {
  const post = useFragment(
    graphql`
      fragment PostRendererFragment_post on Post
      @argumentDefinitions(
        isNative: {
          type: "Boolean!"
          provider: "../providers/isNative.relayprovider"
        }
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
        postWith: {
          type: "Float!"
          provider: "../providers/PostWidth.relayprovider"
        }
        cappedPixelRatio: {
          type: "Float!"
          provider: "../providers/CappedPixelRatio.relayprovider"
        }
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
      ) {
        id
        media {
          kind
          source
          ratio
          largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
            @include(if: $isNative)
          smallURI: uri(width: $postWith, pixelRatio: $cappedPixelRatio)
            @include(if: $isNative)
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

  const {
    content,
    media: { kind, ratio, source, smallURI, largeURI },
  } = post;

  return (
    <View {...props}>
      <View>
        <MediaRenderer
          source={source}
          uri={small ? smallURI : largeURI}
          kind={kind}
          aspectRatio={ratio}
          width={width}
          repeat
          muted={muted}
          paused={paused}
          style={[styles.mediaRenderer, small && styles.mediaRendererSmall]}
        />
        {small && (
          <AuthorCartouche
            userName={author.userName}
            style={styles.smallAuthorCartouche}
          />
        )}
      </View>
      <View style={[styles.content, small && styles.smallContent]}>
        {!small && (
          <Link route="USER" params={{ userName: author.userName }}>
            <AuthorCartouche
              userName={author.userName}
              style={styles.largeAuthorCartouche}
            />
          </Link>
        )}
        {!!content && (
          <Text
            style={styles.text}
            numberOfLines={small ? 2 : undefined}
            ellipsizeMode={'tail'}
          >
            {content}
          </Text>
        )}
      </View>
    </View>
  );
};

export default PostRenderer;

const styles = StyleSheet.create({
  mediaRenderer: {
    backgroundColor: colors.lightGrey,
  },
  mediaRendererSmall: {
    borderRadius: 16,
  },
  content: {
    paddingHorizontal: 20,
  },
  smallContent: {
    paddingHorizontal: 5,
  },
  smallAuthorCartouche: {
    position: 'absolute',
    bottom: 5,
    left: 5,
  },
  largeAuthorCartouche: {
    marginTop: 10,
  },
  text: {
    ...fontFamilies.semiBold,
    marginTop: 5,
    fontSize: 12,
  },
});
