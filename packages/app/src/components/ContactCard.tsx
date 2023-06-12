import { View, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useFragment, graphql } from 'react-relay';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { buildUserUrl } from '#helpers/urlHelpers';
import Text from '#ui/Text';
import type { ContactCard_card$key } from '@azzapp/relay/artifacts/ContactCard_card.graphql';

const ContactCard = ({
  userName,
  profile,
}: {
  userName: string;
  profile: ContactCard_card$key;
}) => {
  const card = useFragment(
    graphql`
      fragment ContactCard_card on Profile {
        profileKind
        firstName
        lastName
        companyName
        companyActivity {
          label
        }
      }
    `,
    profile,
  );

  const styles = useStyleSheet(styleSheet);

  const isPersonal = card?.profileKind === 'personal';

  return (
    <View style={styles.webCardContainer}>
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
          style={{ height: '100%', zIndex: 1 }}
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
            {isPersonal
              ? formatDisplayName(card?.firstName, card?.lastName)
              : card?.companyName}
          </Text>
          <Text variant="small" style={styles.webCardLabel}>
            {isPersonal ? null : card?.companyActivity?.label}
          </Text>
        </View>
        <QRCode
          value={buildUserUrl(userName)}
          size={84}
          color={colors.white}
          backgroundColor={colors.black}
          logoBackgroundColor={colors.black}
          logo={require('#ui/Icon/assets/azzapp.png')}
          logoSize={24}
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
  webCardBackground: {
    position: 'absolute',
    left: -8,
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
