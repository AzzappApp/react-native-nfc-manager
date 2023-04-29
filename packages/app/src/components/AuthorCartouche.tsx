import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Text from '#ui/Text';
import MediaImageRenderer from './medias/MediaImageRenderer';
import type { AuthorCartoucheFragment_profile$key } from '@azzapp/relay/artifacts/AuthorCartoucheFragment_profile.graphql';
import type { ViewProps } from 'react-native';

/**
 * Author cartouche
 * Display a small cartouche with the author picture and username
 */
// TODO components is dummy, replace with real component
const AuthorCartouche = ({
  style,
  variant = 'post',
  author: authorKey,
  ...props
}: ViewProps & {
  author: AuthorCartoucheFragment_profile$key;
  variant?: 'createPost' | 'post' | 'small';
}) => {
  const author = useFragment(
    graphql`
      fragment AuthorCartoucheFragment_profile on Profile
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
        isNative: {
          type: "Boolean!"
          provider: "../providers/isNative.relayprovider"
        }
      ) {
        userName
        card {
          cover {
            media {
              id
              ... on MediaImage {
                avatarURI: uri(width: 25, pixelRatio: $pixelRatio)
                  @include(if: $isNative)
              }
              ... on MediaVideo {
                avatarURI: thumbnail(width: 25, pixelRatio: $pixelRatio)
                  @include(if: $isNative)
              }
            }
          }
        }
      }
    `,
    authorKey,
  );
  const variantStyle = useVariantStyleSheet(computedStyle, variant);
  return (
    <View
      style={[
        variantStyle.container,
        variant === 'small' && variantStyle.containerSmall,
        style,
      ]}
      {...props}
    >
      {author.card?.cover.media.id != null ? (
        <MediaImageRenderer
          width={variant === 'post' ? 21 : 12.5}
          aspectRatio={COVER_RATIO}
          source={author.card.cover.media.id}
          uri={author.card?.cover.media.avatarURI}
          alt={'avatar'}
          style={variantStyle.image}
        />
      ) : (
        author.card?.cover.media.id == null && (
          <View
            style={[
              variantStyle.image,
              variant === 'small' && variantStyle.pictureSmall,
            ]}
          />
        )
      )}
      <Text
        variant={variant === 'post' ? 'button' : 'smallbold'}
        style={[variant === 'small' && variantStyle.userNameSmall]}
      >
        {author.userName}
      </Text>
    </View>
  );
};

const computedStyle = createVariantsStyleSheet(appearance => ({
  default: {
    container: {
      height: AUTHOR_CARTOUCHE_HEIGHT,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    containerSmall: {
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
    pictureSmall: {
      backgroundColor: '#FFF',
    },
    userNameSmall: {
      color: 'white',
    },
  },
  createPost: {
    image: {
      width: 12.5,
      height: 20,
      borderRadius: 3,
      marginRight: 10,
      backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey200,
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
    image: {
      width: 12.5,
      height: 20,
      borderRadius: 3,
      marginRight: 4,
      backgroundColor: colors.white,
    },
  },
}));

export default AuthorCartouche;

export const AUTHOR_CARTOUCHE_HEIGHT = 40;
export const AUTHOR_CARTOUCHE_SMALL_HEIGHT = 28;
