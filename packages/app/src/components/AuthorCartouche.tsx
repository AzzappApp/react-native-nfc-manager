import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import CoverLinkRenderer from './CoverLink/CoverLinkRenderer';
import CoverRenderer from './CoverRenderer';
import Link from './Link';
import type {
  AuthorCartoucheFragment_webCard$data,
  AuthorCartoucheFragment_webCard$key,
} from '#relayArtifacts/AuthorCartoucheFragment_webCard.graphql';
import type { ViewProps } from 'react-native';

type AuthorCartoucheProps = ViewProps & {
  /**
   *
   *
   * @type {AuthorCartoucheFragment_webCard$key}
   */
  author: AuthorCartoucheFragment_webCard$key;
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

  /**
   * callback when the cartouche is pressed
   */
  onPress?: () => void;
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
  onPress,
  ...props
}: AuthorCartoucheProps) => {
  const author = useFragment(
    graphql`
      fragment AuthorCartoucheFragment_webCard on WebCard {
        id
        userName
        cardIsPublished
        ...CoverRenderer_webCard
        ...CoverLinkRenderer_webCard
        ...CoverLinkRendererIos_webCard
      }
    `,
    authorKey,
  );

  const styles = useVariantStyleSheet(stylesheet, variant);

  if (onPress) {
    return (
      <PressableOpacity
        style={[styles.container, style]}
        onPress={onPress}
        disabled={!author?.cardIsPublished}
        {...props}
      >
        <AuthorCartoucheContent
          hideUserName={hideUserName}
          variant={variant}
          author={author}
        />
      </PressableOpacity>
    );
  }

  if (activeLink && author.userName) {
    return (
      <Link
        route="WEBCARD"
        params={{ userName: author.userName }}
        disabled={!author?.cardIsPublished}
      >
        <PressableOpacity style={[styles.container, style]} {...props}>
          <AuthorCartoucheContent
            hideUserName={hideUserName}
            variant={variant}
            author={author}
            animated
          />
        </PressableOpacity>
      </Link>
    );
  }

  return (
    <View style={[styles.container, style]} {...props}>
      <AuthorCartoucheContent
        hideUserName={hideUserName}
        variant={variant}
        author={author}
      />
    </View>
  );
};

const AuthorCartoucheContent = ({
  hideUserName,
  variant = 'post',
  author,
  animated,
}: {
  hideUserName?: boolean;
  variant?: AuthorCartoucheProps['variant'];
  author?: AuthorCartoucheFragment_webCard$data;
  animated?: boolean;
}) => {
  const styles = useVariantStyleSheet(stylesheet, variant);

  return (
    <>
      <View style={styles.image}>
        {author?.cardIsPublished === false ? (
          <View />
        ) : animated ? (
          <CoverLinkRenderer
            webCard={author!}
            width={21}
            webCardId={author!.id}
            userName={author!.userName}
            disabled={!author?.cardIsPublished}
            canPlay={false}
          />
        ) : (
          <CoverRenderer width={styles.image.width} webCard={author} />
        )}
      </View>
      {!hideUserName && (
        <View>
          <Text
            variant={variant === 'post' ? 'button' : 'smallbold'}
            style={styles.userName}
          >
            {author?.userName}
          </Text>
          {author?.cardIsPublished === false && (
            <Text variant="small">
              <FormattedMessage
                defaultMessage="Unpublished"
                description="AuthorCartouche webcard unpublished information"
              />
            </Text>
          )}
        </View>
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
      borderCurve: 'continuous',
      marginRight: 10,
      backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey200,
      aspectRatio: COVER_RATIO,
      overflow: 'hidden',
    },
  },
  post: {
    image: {
      width: 21,
      height: 34,
      borderRadius: 4,
      borderCurve: 'continuous',
      marginRight: 5,
      backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey200,
      overflow: 'hidden',
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
      borderCurve: 'continuous',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
    },
    image: {
      width: 12.5,
      height: 20,
      borderRadius: 3,
      borderCurve: 'continuous',
      marginRight: 4,
      backgroundColor: colors.white,
      overflow: 'hidden',
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
