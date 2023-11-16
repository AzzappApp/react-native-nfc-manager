import { useMemo } from 'react';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import Link from './Link';
import MediaImageRenderer from './medias/MediaImageRenderer';
import type { MediaImageRendererProps } from './medias';
import type { AuthorCartoucheFragment_profile$key } from '@azzapp/relay/artifacts/AuthorCartoucheFragment_profile.graphql';
import type { ViewProps } from 'react-native';

type AuthorCartoucheProps = ViewProps & {
  /**
   *
   *
   * @type {AuthorCartoucheFragment_profile$key}
   */
  author: AuthorCartoucheFragment_profile$key;
  /**
   * variant of the author cartouche
   *
   * @type {('createPost' | 'post' | 'small')}
   */
  variant?: 'createPost' | 'post' | 'small';
  /**
   *  username should be hidden. If not only the image cover will be renderer
   *
   * @type {boolean}
   */
  hideUserName?: boolean;
  /**
   * true if the cartouche is a link to the Profile page
   *
   * @type {boolean}
   */
  activeLink?: boolean;
};
/**
 * Author cartouche
 * Display a small cartouche with the author picture and username
 */
const AuthorCartouche = ({
  style,
  variant = 'post',
  author: authorKey,
  activeLink = false,
  hideUserName = false,
  ...props
}: AuthorCartoucheProps) => {
  const author = useFragment(
    graphql`
      fragment AuthorCartoucheFragment_profile on Profile
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
      ) {
        id
        userName
        cardColors {
          primary
          light
          dark
        }
        cardCover {
          media {
            id
            ... on MediaImage {
              avatarURI: uri(width: 25, pixelRatio: $pixelRatio)
            }
            ... on MediaVideo {
              avatarURI: thumbnail(width: 25, pixelRatio: $pixelRatio)
            }
          }
          foregroundColor
          foreground {
            id
            uri: uri(width: 25, pixelRatio: $pixelRatio)
          }
        }
      }
    `,
    authorKey,
  );

  const styles = useVariantStyleSheet(stylesheet, variant);
  const { cardCover, cardColors } = author ?? {};
  const { media, foreground, foregroundColor } = cardCover ?? {};

  const mediaSource = useMemo(
    () =>
      media?.id
        ? {
            uri: media.avatarURI!,
            mediaId: media.id,
            requestedSize: MEDIA_WIDTH,
          }
        : null,
    [media?.avatarURI, media?.id],
  );

  const foregroundSource = useMemo(
    () =>
      foreground?.id
        ? {
            uri: foreground.uri!,
            mediaId: foreground.id,
            requestedSize: MEDIA_WIDTH,
          }
        : null,
    [foreground?.id, foreground?.uri],
  );

  if (activeLink) {
    return (
      <Link route="PROFILE" params={{ userName: author.userName }}>
        <PressableOpacity style={[styles.container, style]} {...props}>
          <AuthorCartoucheContent
            mediaSource={mediaSource}
            foregroundSource={foregroundSource}
            foregroundColor={foregroundColor}
            hideUserName={hideUserName}
            variant={variant}
            cardColors={cardColors}
            author={author}
          />
        </PressableOpacity>
      </Link>
    );
  }

  return (
    <View style={[styles.container, style]} {...props}>
      <AuthorCartoucheContent
        mediaSource={mediaSource}
        foregroundSource={foregroundSource}
        foregroundColor={foregroundColor}
        hideUserName={hideUserName}
        variant={variant}
        cardColors={cardColors}
        author={author}
      />
    </View>
  );
};

const AuthorCartoucheContent = ({
  mediaSource,
  foregroundSource,
  foregroundColor,
  hideUserName,
  variant = 'post',
  cardColors,
  author,
}: {
  mediaSource?: MediaImageRendererProps['source'] | null;
  foregroundSource?: MediaImageRendererProps['source'] | null;
  foregroundColor?: string | null;
  hideUserName?: boolean;
  variant?: AuthorCartoucheProps['variant'];
  cardColors?: {
    primary: string;
    light: string;
    dark: string;
  } | null;
  author?: { userName: string | null };
}) => {
  const styles = useVariantStyleSheet(stylesheet, variant);

  const foregroundStyle = useMemo(
    () => [styles.layer, styles.image, { backgroundColor: 'transparent' }],
    [styles.layer, styles.image],
  );

  return (
    <>
      {mediaSource != null ? (
        <View>
          <MediaImageRenderer
            source={mediaSource}
            alt="avatar"
            style={styles.image}
          />
          {foregroundSource?.mediaId && (
            <MediaImageRenderer
              testID="CoverPreview_foreground"
              source={foregroundSource}
              tintColor={swapColor(foregroundColor, cardColors)}
              style={foregroundStyle}
              alt={'Cover edition foreground'}
            />
          )}
        </View>
      ) : (
        <View style={styles.image} />
      )}
      {!hideUserName && (
        <Text
          variant={variant === 'post' ? 'button' : 'smallbold'}
          style={styles.userName}
        >
          {author?.userName}
        </Text>
      )}
    </>
  );
};

const stylesheet = createVariantsStyleSheet(appearance => ({
  default: {
    container: {
      height: AUTHOR_CARTOUCHE_HEIGHT,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    userName: {},
    layer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
  },
  createPost: {
    image: {
      width: 12.5,
      height: 20,
      borderRadius: 3,
      marginRight: 10,
      backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey200,
      aspectRatio: COVER_RATIO,
    },
  },
  post: {
    image: {
      width: 21,
      height: 34,
      borderRadius: 4,
      marginRight: 5,
      backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey200,
    },
    text: { color: appearance === 'light' ? colors.black : colors.white },
  },
  small: {
    container: {
      height: AUTHOR_CARTOUCHE_SMALL_HEIGHT,
      paddingTop: 4,
      paddingBottom: 4,
      paddingLeft: 6,
      paddingRight: 12,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
    },
    image: {
      width: 12.5,
      height: 20,
      borderRadius: 3,
      marginRight: 4,
      backgroundColor: colors.white,
    },
    userName: {
      color: 'white',
    },
  },
}));

export default AuthorCartouche;

export const MEDIA_WIDTH = 25;
export const AUTHOR_CARTOUCHE_HEIGHT = 40;
export const AUTHOR_CARTOUCHE_SMALL_HEIGHT = 28;
