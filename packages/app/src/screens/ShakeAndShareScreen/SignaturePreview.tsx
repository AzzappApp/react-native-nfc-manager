import { Image } from 'expo-image';
import { FormattedMessage } from 'react-intl';
import { View, StyleSheet, Text } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import { getEmailSignatureTitleColor } from '@azzapp/shared/colorsHelpers';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import { AVATAR_WIDTH } from '#screens/MultiUserScreen/Avatar';
import type { SignaturePreview_profile$key } from '#relayArtifacts/SignaturePreview_profile.graphql';
type SignaturePreviewProps = {
  profile: SignaturePreview_profile$key;
};

const SignaturePreview = ({ profile: profileKey }: SignaturePreviewProps) => {
  const {
    webCard,
    contactCard,
    avatar,
    logo: profileLogo,
    banner: profileBanner,
  } = useFragment(
    graphql`
      fragment SignaturePreview_profile on Profile
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
      ) {
        webCard {
          id
          isMultiUser
          cardColors {
            primary
          }
          commonInformation {
            company
            phoneNumbers {
              number
            }
            emails {
              address
            }
          }
          logo {
            id
            uri: uri(width: 180, pixelRatio: $pixelRatio)
          }
          banner {
            id
            uri: uri(width: 220, pixelRatio: $pixelRatio)
            aspectRatio
          }
        }
        contactCard {
          firstName
          lastName
          title
          company
          phoneNumbers {
            number
          }
          emails {
            address
          }
        }
        avatar {
          id
          uri: uri(width: 112, pixelRatio: $pixelRatio)
        }
        logo {
          id
          uri: uri(width: 180, pixelRatio: $pixelRatio)
        }
        banner {
          id
          uri: uri(width: 220, pixelRatio: $pixelRatio)
          aspectRatio
        }
      }
    `,
    profileKey,
  );

  const phones = (
    (webCard?.isMultiUser ? webCard?.commonInformation?.phoneNumbers : []) ?? []
  ).concat(contactCard?.phoneNumbers ?? []);

  const mails = (
    (webCard?.isMultiUser ? webCard?.commonInformation?.emails : []) ?? []
  ).concat(contactCard?.emails ?? []);

  const company =
    (webCard?.isMultiUser && webCard?.commonInformation?.company) ||
    contactCard?.company;

  const logo =
    webCard?.isMultiUser && webCard?.logo ? webCard?.logo : profileLogo;

  const banner =
    webCard?.isMultiUser && webCard?.banner ? webCard?.banner : profileBanner;

  const titleColor = getEmailSignatureTitleColor(webCard?.cardColors?.primary);

  return (
    <>
      {avatar?.uri && (
        <MediaImageRenderer
          source={{
            uri: avatar.uri,
            mediaId: avatar.id ?? '',
            requestedSize: AVATAR_WIDTH,
          }}
          style={styles.avatar}
        />
      )}
      <View style={styles.detailCardView}>
        <View style={styles.leftView}>
          <Text
            style={styles.displayNameText}
            allowFontScaling
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {formatDisplayName(contactCard?.firstName, contactCard?.lastName)}
          </Text>
          {contactCard?.title && (
            <Text
              style={[styles.titleText, { color: titleColor }]}
              allowFontScaling
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {contactCard.title}
            </Text>
          )}
          {company && <Text style={styles.textCompany}>{company}</Text>}
          <Text
            style={[
              styles.saveButtonText,
              {
                color: titleColor,
              },
            ]}
            numberOfLines={1}
          >
            <FormattedMessage
              defaultMessage="Save my contact"
              description="Save my contact label in Signature preview of Share screen"
            />
          </Text>
        </View>
        <View style={{ width: '50%', paddingLeft: 15 }}>
          {phones.map(phone => {
            return (
              <View key={phone.number} style={styles.phoneMailView}>
                <Text
                  style={styles.phoneMail}
                  allowFontScaling
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {phone.number}
                </Text>
              </View>
            );
          })}
          {mails?.map(email => {
            return (
              <View key={email.address} style={styles.phoneMailView}>
                <Text
                  style={styles.phoneMail}
                  adjustsFontSizeToFit
                  allowFontScaling
                  numberOfLines={1}
                >
                  {email.address}
                </Text>
              </View>
            );
          })}
          {logo?.uri && (
            <Image
              source={{ uri: logo.uri }}
              style={styles.logoImage}
              contentFit="contain"
              contentPosition="left"
            />
          )}
        </View>
      </View>
      {banner?.uri && (
        <Image
          source={{ uri: banner.uri }}
          style={[styles.bannerImage, { aspectRatio: banner.aspectRatio }]}
          contentFit="fill"
        />
      )}
    </>
  );
};

export default SignaturePreview;

const SCALE_RATIO = 0.7;

const styles = StyleSheet.create({
  detailCardView: { flexDirection: 'row', marginTop: 20 * SCALE_RATIO },
  logoImage: {
    marginTop: 15 * SCALE_RATIO,
    height: 60 * SCALE_RATIO,
    width: '100%',
  },
  bannerImage: {
    marginTop: 15 * SCALE_RATIO,
    width: '100%',
  },
  leftView: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: colors.grey100,
  },
  phoneMailView: {
    height: 20,
  },
  avatar: {
    width: 60 * SCALE_RATIO,
    height: 60 * SCALE_RATIO,
    borderRadius: 30 * SCALE_RATIO,
  },
  displayNameText: {
    color: colors.black,
    fontFamily: 'Helvetica Neue Medium',
    fontWeight: '500',
    fontSize: 16 * SCALE_RATIO,
    lineHeight: 20 * SCALE_RATIO,
    marginBottom: 5 * SCALE_RATIO,
  },
  titleText: {
    fontFamily: 'Helvetica Neue Medium',
    fontWeight: '500',
    fontSize: 14 * SCALE_RATIO,
    lineHeight: 18 * SCALE_RATIO,
    marginBottom: 5 * SCALE_RATIO,
  },
  textCompany: {
    color: colors.grey500,
    fontSize: 12 * SCALE_RATIO,
    fontFamily: 'Helvetica Neue',
    marginBottom: 5 * SCALE_RATIO,
    fontWeight: '400',
  },
  phoneMail: {
    color: colors.black,
    fontFamily: 'Helvetica Neue',
    fontSize: 12 * SCALE_RATIO,
    textAlign: 'left',
    marginLeft: 4 * SCALE_RATIO,
  },
  saveButtonText: {
    fontSize: 12 * SCALE_RATIO,
    fontFamily: 'Helvetica Neue',
    fontWeight: '500',
    textAlign: 'left',
    textDecorationLine: 'underline',
    marginTop: 10,
  },
});
