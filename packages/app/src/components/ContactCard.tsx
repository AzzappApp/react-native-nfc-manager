import { View, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useFragment, graphql } from 'react-relay';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import {
  buildUserUrl,
  buildUserUrlWithContactCard,
} from '@azzapp/shared/urlHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import type { ContactCard_card$key } from '@azzapp/relay/artifacts/ContactCard_card.graphql';

const ContactCard = ({
  userName,
  contactCard: contactCardKey,
}: {
  userName: string;
  contactCard: ContactCard_card$key;
}) => {
  const contactCard = useFragment(
    graphql`
      fragment ContactCard_card on ContactCard {
        id
        firstName
        lastName
        title
        company
        backgroundStyle {
          backgroundColor
        }
        serializedContactCard {
          data
          signature
        }
      }
    `,
    contactCardKey,
  );

  const styles = useStyleSheet(styleSheet);

  const contactCardUrl = buildUserUrlWithContactCard(
    userName,
    contactCard.serializedContactCard.data,
    contactCard.serializedContactCard.signature,
  );

  return (
    <View style={[styles.webCardContainer, contactCard.backgroundStyle]}>
      <View style={{ flex: 1 }}>
        <Image
          source={require('#assets/logo-full_white.png')}
          resizeMode="contain"
          style={{ width: 85 }}
        />
      </View>
      <View style={styles.webCardBackground}>
        <Image
          source={require('#assets/webcard/logo-substract.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Image
          source={require('#assets/webcard/background.png')}
          style={styles.webCardBackgroundImage}
        />
      </View>

      <View style={styles.webCardContent}>
        <View style={styles.webCardInfos}>
          <Text variant="large" style={styles.webCardLabel} numberOfLines={1}>
            {formatDisplayName(contactCard?.firstName, contactCard?.lastName)}
          </Text>
          <Text variant="small" style={styles.webCardLabel}>
            {contactCard.title}
          </Text>
          <Text
            style={[
              styles.webCardLabel,
              { fontSize: 10, fontStyle: 'italic', fontWeight: '400' },
            ]}
          >
            {contactCard.company}
          </Text>
        </View>
        <QRCode
          value={contactCardUrl}
          size={84}
          color={colors.white}
          backgroundColor={colors.black}
        />
      </View>
      <View style={styles.webCardFooter}>
        <Text
          variant="xsmall"
          numberOfLines={1}
          style={[styles.webCardLabel, { opacity: 0.5 }]}
        >
          {buildUserUrl(userName)}
        </Text>
      </View>
    </View>
  );
};

export default ContactCard;

export const styleSheet = createStyleSheet(appearance => ({
  webCardContainer: [
    {
      backgroundColor: colors.black,
      paddingVertical: 20,
      paddingHorizontal: 26,
      borderRadius: 13,
      width: '100%',
      aspectRatio: 1.693,
    },
    shadow(appearance),
  ],
  logo: { height: '100%', zIndex: 1, left: -4 },
  webCardBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
    bottom: 0,
    borderRadius: 13,
  },
  webCardBackgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  webCardContent: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
    gap: 10,
  },
  webCardLabel: { color: colors.white },
  webCardFooter: { flex: 1, justifyContent: 'flex-end' },
  webCardInfos: { flex: 1 },
}));
