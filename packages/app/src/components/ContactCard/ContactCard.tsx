import { memo, useMemo } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useFragment, graphql } from 'react-relay';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import {
  buildUserUrl,
  buildUserUrlWithContactCard,
} from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import Text from '#ui/Text';
import type { ContactCard_profile$key } from '@azzapp/relay/artifacts/ContactCard_profile.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type ContactCardProps = {
  profile: ContactCard_profile$key;
  style?: StyleProp<ViewStyle>;
  height: number;
};
const ContactCard = ({
  profile: profileKey,
  height,
  style,
}: ContactCardProps) => {
  const {
    contactCard,
    serializedContactCard,
    webCard: { userName, cardColors, commonInformation },
  } = useFragment(
    graphql`
      fragment ContactCard_profile on Profile {
        webCard {
          userName
          cardColors {
            primary
            light
          }
          commonInformation {
            company
          }
        }
        contactCard {
          firstName
          lastName
          title
          company
        }
        serializedContactCard {
          data
          signature
        }
      }
    `,
    profileKey,
  );

  const backgroundColor = cardColors?.primary ?? colors.black;
  const readableColor = useMemo(
    () => getTextColor(backgroundColor),
    [backgroundColor],
  );

  const contactCardUrl = useMemo(() => {
    if (!contactCard) {
      return null;
    }
    const { data, signature } = serializedContactCard;
    return buildUserUrlWithContactCard(userName, data, signature);
  }, [contactCard, serializedContactCard, userName]);

  if (!contactCard) {
    return null;
  }

  return (
    <View
      style={[
        styles.webCardContainer,
        {
          backgroundColor,
          height,
          borderRadius: height * CONTACT_CARD_RADIUS_HEIGHT,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.webCardBackground,
          {
            height,
            borderRadius: height * CONTACT_CARD_RADIUS_HEIGHT,
          },
        ]}
      >
        <Image
          source={require('#assets/webcard/logo-substract.png')}
          style={[
            styles.logo,
            {
              height,
              width: 0.74 * height,
            },
          ]}
          resizeMode="contain"
        />
        <Image
          source={require('#assets/webcard/background.png')}
          style={[
            styles.webCardBackgroundImage,
            { width: 1.37 * height, height },
          ]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View>
          <Image
            source={require('#assets/logo-full_white.png')}
            resizeMode="contain"
            style={{ width: 85, tintColor: readableColor }}
          />
        </View>

        <View style={[styles.webCardContent]}>
          <View style={styles.webcardText}>
            <Text
              variant="large"
              style={[
                styles.webCardLabel,
                { color: readableColor, fontSize: 14 },
              ]}
              numberOfLines={1}
            >
              {formatDisplayName(contactCard?.firstName, contactCard?.lastName)}
            </Text>
            {contactCard.title && (
              <Text
                variant="small"
                style={[styles.webCardLabel, { color: readableColor }]}
              >
                {contactCard.title}
              </Text>
            )}
            {(commonInformation?.company || contactCard.company) && (
              <Text
                variant="large"
                style={[styles.webCardLabel, { color: readableColor }]}
              >
                {commonInformation?.company ?? contactCard.company}
              </Text>
            )}
          </View>
          <View style={styles.qrCodeContainer}>
            {contactCardUrl && (
              <QRCode
                value={contactCardUrl}
                size={80}
                color={readableColor}
                backgroundColor={'transparent'}
              />
            )}
          </View>
        </View>
        <View style={styles.webCardFooter}>
          <Text
            variant="xsmall"
            numberOfLines={1}
            style={[
              styles.webCardLabel,
              { opacity: 0.5, color: readableColor },
            ]}
          >
            {buildUserUrl(userName)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const CONTACT_CARD_RATIO = 1 / 0.6;
export const CONTACT_CARD_RADIUS_HEIGHT = 1 / 10;
// use in list on HomeScreen
export default memo(ContactCard);
export const CONTACT_CARD_ASPECT_RATIO = 0.6;

const styles = StyleSheet.create({
  webCardContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    aspectRatio: CONTACT_CARD_RATIO,
    overflow: 'visible',
    flexDirection: 'row',
    borderCurve: 'continuous',
  },
  logo: { zIndex: 1 },
  webCardBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
    bottom: 0,
    borderCurve: 'continuous',
  },
  webCardBackgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  webCardContent: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    rowGap: 10,
  },
  webCardLabel: { color: colors.white },
  webCardFooter: { justifyContent: 'flex-end', marginTop: 10 },
  webcardText: {
    flexDirection: 'column',
    height: '100%',
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    rowGap: 5,
  },
  qrCodeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
});
