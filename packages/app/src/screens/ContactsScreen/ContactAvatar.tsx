import { View } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, textStyles } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import type { ViewProps } from 'react-native';

type AvatarProps = ViewProps & {
  firstName?: string;
  lastName?: string;
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
    <View
      {...others}
      style={[
        {
          width: AVATAR_DEFAULT_WIDTH * scale,
          height: (AVATAR_DEFAULT_WIDTH * scale) / COVER_RATIO,
        },
        style,
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
          <MediaImageRenderer source={avatar} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text variant="smallbold" style={styles.initials}>
              {firstName?.substring(0, 1)}
              {lastName?.substring(0, 1)}
              {!firstName && !lastName && company?.substring(0, 1)}
            </Text>
          </View>
        )}
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
      </View>
    </View>
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
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 12.5,
    fontSize: 12.5,
    color: 'white',
  },
  nameSmall: {
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 8.75,
    fontSize: 8.75,
    color: 'white',
  },
  company: {
    marginTop: 5,
    fontSize: 6.5,
    lineHeight: 8.75,
    textAlign: 'center',
    color: 'white',
  },
}));

export const AVATAR_WIDTH = 112;

export default ContactAvatar;
