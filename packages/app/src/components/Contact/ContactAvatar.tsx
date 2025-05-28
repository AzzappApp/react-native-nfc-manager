import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, shadow, textStyles } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import type { ViewProps } from 'react-native';

type AvatarProps = ViewProps & {
  firstName?: string | null;
  lastName?: string | null;
  small?: boolean;
  name?: string;
  company?: string;
  avatar: {
    uri: string;
    mediaId: string;
    requestedSize: number;
  } | null;
};

const ContactAvatar = ({
  firstName,
  lastName,
  name,
  company,
  style,
  small,
  avatar,
  ...others
}: AvatarProps) => {
  const styles = useStyleSheet(styleSheet);
  const scale = small ? 0.4375 : 1;

  return (
    <>
      <View
        {...others}
        style={[
          {
            width: AVATAR_DEFAULT_WIDTH * scale,
            height: (AVATAR_DEFAULT_WIDTH * scale) / COVER_RATIO,
            borderRadius: AVATAR_DEFAULT_WIDTH * COVER_CARD_RADIUS,
          },
          style,
          styles.shadow,
        ]}
      >
        <View
          style={[
            styles.placeholder,
            {
              transform: [{ scale }],
              position: 'relative',
              top: small ? -AVATAR_DEFAULT_WIDTH * scale : 0,
              left: small ? -AVATAR_DEFAULT_WIDTH * COVER_RATIO * scale : 0,
              width: AVATAR_DEFAULT_WIDTH,
              borderRadius: AVATAR_DEFAULT_WIDTH * COVER_CARD_RADIUS,
            },
            style,
          ]}
        >
          {avatar && (
            <MediaImageRenderer
              source={avatar}
              style={{
                height: AVATAR_DEFAULT_WIDTH / COVER_RATIO,
                width: AVATAR_DEFAULT_WIDTH,
                borderRadius: AVATAR_DEFAULT_WIDTH * COVER_CARD_RADIUS,
                position: 'absolute',
                overflow: 'hidden',
              }}
              fit="cover"
              blurRadius={40}
            />
          )}

          {avatar ? (
            <>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.30)', '#000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  { borderRadius: AVATAR_DEFAULT_WIDTH * COVER_CARD_RADIUS },
                  styles.layer,
                ]}
              />
              <MediaImageRenderer
                fit="cover"
                source={avatar}
                style={styles.avatarImageBackground}
              />
            </>
          ) : (
            <View style={styles.avatar}>
              <Text variant="smallbold" style={styles.initials}>
                {firstName?.substring(0, 1)}
                {lastName?.substring(0, 1)}
                {!firstName && !lastName && company?.substring(0, 1)}
              </Text>
            </View>
          )}
          <AvatarText name={name} company={company} />
        </View>
      </View>
    </>
  );
};

export const EnrichmentOverlay = ({
  overlayEnrichmentInProgress,
  overlayEnrichmentApprovementNeeded,
  small,
  name,
  company,
  scale = 1,
  style,
  ...others
}: ViewProps & {
  overlayEnrichmentInProgress?: boolean;
  overlayEnrichmentApprovementNeeded?: boolean;
  small?: boolean;
  scale?: number;
  name?: string | null;
  company?: string | null;
}) => {
  const styles = useStyleSheet(styleSheet);

  if (!overlayEnrichmentInProgress && !overlayEnrichmentApprovementNeeded) {
    return null;
  }
  return (
    <View
      {...others}
      style={[
        {
          position: 'absolute',
          width: AVATAR_DEFAULT_WIDTH * scale,
          height: (AVATAR_DEFAULT_WIDTH * scale) / COVER_RATIO,
          borderRadius: AVATAR_DEFAULT_WIDTH * COVER_CARD_RADIUS,
        },
        style,
        styles.shadow,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          flex: 1,
          transform: [{ scale }],
          top: small ? -AVATAR_DEFAULT_WIDTH * scale : 0,
          left: small ? -AVATAR_DEFAULT_WIDTH * COVER_RATIO * scale : 0,
          width: AVATAR_DEFAULT_WIDTH,
          borderRadius: AVATAR_DEFAULT_WIDTH * COVER_CARD_RADIUS,
        }}
      >
        <LinearGradient
          // Button Linear Gradient
          colors={['#B02EFB', '#0C52AE', '#145BB9', '#23CFCC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.overlayGradient}
        />
        {overlayEnrichmentApprovementNeeded && (
          <View style={styles.overlayButton}>
            <Icon
              size={17}
              icon="check_filled"
              style={{ tintColor: colors.white }}
              tintColor={colors.white}
            />
          </View>
        )}
        <View style={styles.overlayTextContainer}>
          <Icon
            size={48}
            style={styles.overlayIcon}
            icon="filters"
            tintColor={colors.white}
          />
          {overlayEnrichmentApprovementNeeded && (
            <AvatarText name={name} company={company} />
          )}
        </View>
      </View>
    </View>
  );
};

export const AvatarText = ({
  name,
  company,
}: {
  name?: string | null;
  company?: string | null;
}) => {
  const styles = useStyleSheet(styleSheet);

  return (
    <>
      {name && (
        <Text
          style={[textStyles.small, company ? styles.nameSmall : styles.name]}
          numberOfLines={2}
        >
          {name}
        </Text>
      )}
      {company && (
        <Text numberOfLines={1} style={styles.company}>
          {company}
        </Text>
      )}
    </>
  );
};

const AVATAR_DEFAULT_WIDTH = 80;

const styleSheet = createStyleSheet(appearance => ({
  placeholder: {
    backgroundColor: colors.grey1000,
    aspectRatio: COVER_RATIO,
    paddingTop: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  avatarImageBackground: {
    width: 61,
    height: 61,
    borderRadius: 61,
    backgroundColor: colors.grey50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 61,
    height: 61,
    borderRadius: 61,
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.black,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.grey800,
    textTransform: 'uppercase',
    lineHeight: 33,
    fontSize: 27,
  },
  name: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 17,
    fontSize: 12.5,
    color: 'white',
  },
  nameSmall: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 11,
    fontSize: 8.75,
    color: 'white',
  },
  company: {
    marginTop: 2.5,
    fontSize: 6.5,
    lineHeight: 9.75,
    textAlign: 'center',
    color: 'white',
  },
  shadow: shadow({ appearance, direction: 'bottom' }),
  layer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    top: 0,
    right: 0,
    aspectRatio: COVER_RATIO,
  },
  overlayGradient: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 8,
    opacity: 0.9,
  },
  overlayButton: {
    position: 'absolute',
    flex: 1,
    alignSelf: 'center',
    borderColor: colors.white,
    borderWidth: 7,
    borderRadius: 31,
    width: 31,
    height: 31,
    top: 5,
    right: 5,
  },
  overlayTextContainer: {
    aspectRatio: COVER_RATIO,
    paddingTop: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  overlayIcon: {
    top: 6,
    marginBottom: 13,
    tintColor: colors.white,
  },
}));

export const AVATAR_WIDTH = 112;

export default ContactAvatar;
