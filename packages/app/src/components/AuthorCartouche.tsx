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
  variant?: 'post' | 'small';
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
              avatarURI: uri(width: 25, pixelRatio: $pixelRatio)
                @include(if: $isNative)
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
          width={variant === 'small' ? 20 : 21}
          aspectRatio={variant === 'small' ? 1 : COVER_RATIO}
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
        variant="button"
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
      padding: 4,
      paddingEnd: 12,
      borderRadius: 20,
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
      width: 20,
      height: 20,
      borderRadius: 10,
      marginRight: 4,
      backgroundColor: colors.white,
    },
  },
}));

export default AuthorCartouche;

export const AUTHOR_CARTOUCHE_HEIGHT = 40;
export const AUTHOR_CARTOUCHE_SMALL_HEIGHT = 30;
