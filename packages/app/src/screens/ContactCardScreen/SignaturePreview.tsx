import { Image } from 'expo-image';
import { View, StyleSheet, Text } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import { AVATAR_WIDTH } from '#screens/MultiUserScreen/Avatar';

import Icon from '#ui/Icon';
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
          userName
          isMultiUser
          cardColors {
            primary
          }
          commonInformation {
            company
            phoneNumbers {
              number
              selected
            }
            emails {
              address
              selected
            }
          }
          logo {
            id
            uri: uri(width: 180, pixelRatio: $pixelRatio)
          }
        }
        contactCard {
          firstName
          lastName
          title
          company
          phoneNumbers {
            number
            selected
          }
          emails {
            address
            selected
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
      }
    `,
    profileKey,
  );

  const phones = (webCard?.commonInformation?.phoneNumbers ?? []).concat(
    contactCard?.phoneNumbers?.filter(p => p.selected) ?? [],
  );

  const mails = (webCard?.commonInformation?.emails ?? []).concat(
    contactCard?.emails?.filter(p => p.selected) ?? [],
  );

  const company = webCard?.commonInformation?.company || contactCard?.company;

  const logo =
    webCard?.isMultiUser && webCard?.logo ? webCard?.logo : profileLogo;

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
              style={[
                styles.titleText,
                { color: webCard?.cardColors?.primary ?? colors.black },
              ]}
              allowFontScaling
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {contactCard.title}
            </Text>
          )}
          {company && <Text style={styles.textCompany}>{company}</Text>}
          <View
            style={[
              styles.saveButton,
              {
                backgroundColor: webCard?.cardColors?.primary ?? colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.saveButtonFont,
                {
                  color: getTextColor(
                    webCard?.cardColors?.primary ?? colors.white,
                  ),
                },
              ]}
              numberOfLines={1}
            >
              Save my contact
            </Text>
          </View>
        </View>
        <View style={{ width: '50%', paddingLeft: 15 }}>
          {phones.map(phone => {
            return (
              <View key={phone.number} style={styles.phoneMailView}>
                <Icon icon="phone_full" size={14} tintColor={colors.black} />
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
                <Icon icon="mail" size={14} tintColor={colors.black} />
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
  leftView: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: colors.grey100,
  },
  phoneMailView: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
    fontSize: 16 * SCALE_RATIO,
    lineHeight: 20 * SCALE_RATIO,
    marginBottom: 5 * SCALE_RATIO,
  },
  titleText: {
    fontFamily: 'Helvetica Neue Medium',
    fontSize: 14 * SCALE_RATIO,
    lineHeight: 18 * SCALE_RATIO,
    marginBottom: 5 * SCALE_RATIO,
  },
  textCompany: {
    color: '#87878E',
    fontSize: 12 * SCALE_RATIO,
    fontFamily: 'Helvetica Neue',
    marginBottom: 5 * SCALE_RATIO,
  },
  phoneMail: {
    color: colors.black,
    fontFamily: 'Helvetica Neue',
    fontSize: 12 * SCALE_RATIO,
    textAlign: 'center',
    marginLeft: 4 * SCALE_RATIO,
  },
  saveButton: {
    height: 34 * SCALE_RATIO,
    maxWidth: 190 * SCALE_RATIO,
    paddingLeft: 5 * SCALE_RATIO,
    paddingRight: 5 * SCALE_RATIO,
    borderRadius: 48 * SCALE_RATIO,
    fontSize: 12 * SCALE_RATIO,
    marginTop: 12 * SCALE_RATIO,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonFont: {
    fontSize: 12 * SCALE_RATIO,
    fontFamily: 'Helvetica Neue',
    fontWeight: 700,
  },
});
