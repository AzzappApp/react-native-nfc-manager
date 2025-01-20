import * as Sentry from '@sentry/react-native';
import { type Contact } from 'expo-contacts';
import { File, Paths } from 'expo-file-system/next';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Linking, Platform, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import ShareCommand from 'react-native-share';
import { colors, shadow } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import { buildVCardFromExpoContact } from '#helpers/contactCardHelpers';
import { reworkContactForDeviceInsert } from '#helpers/contactListHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import { sanitizeFilePath } from '#helpers/fileHelpers';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon, { SocialIcon } from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { CoverRenderer_webCard$key } from '#relayArtifacts/CoverRenderer_webCard.graphql';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';

type Props = {
  details: ContactDetails;
  onClose: () => void;
  onSave: () => void;
};

const ContactDetailsBody = ({ details, onSave, onClose }: Props) => {
  const { bottom } = useScreenInsets();
  const intl = useIntl();
  const styles = useStyleSheet(stylesheet);
  const router = useRouter();

  const date = useMemo(() => {
    if (!details) {
      return '';
    }

    const lowercase = new Date(details.createdAt).toLocaleDateString(
      undefined,
      {
        dateStyle: 'long',
      },
    );

    return lowercase
      .split(' ')
      .map(section => section[0].toUpperCase() + section.substring(1))
      .join(' ');
  }, [details]);

  const avatar = details?.image?.uri;

  const birthday = details.dates?.find(date => date.label === 'birthday');

  const onShare = async () => {
    const contact = reworkContactForDeviceInsert(details as Contact);
    const vcardData = await buildVCardFromExpoContact(contact);
    const contactName = (
      (details.firstName || '') +
      ' ' +
      (details.lastName || '')
    ).trim();
    const filePath =
      Paths.cache.uri +
      sanitizeFilePath(contactName.length ? contactName : 'contact') +
      '.vcf';

    let file;
    try {
      file = new File(filePath);
      file.create();
      // generate file
      file.write(vcardData.toString());
      // share the file
      await ShareCommand.open({
        url: filePath,
        type: 'text/x-vcard',
      });
      // clean up file afterward
      file.delete();
    } catch (e) {
      Sentry.captureException(e);
      console.error(e);
      file?.delete();
    }
  };

  return (
    <Container style={styles.container}>
      <PressableNative style={styles.close} onPress={onClose}>
        <Icon icon="close" size={24} />
      </PressableNative>
      <PressableNative style={styles.share} onPress={onShare}>
        <Icon icon="share" size={24} style={styles.shareIcon} />
      </PressableNative>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, styles.avatarWrapper]}>
            {avatar ? (
              <Image source={avatar} style={styles.avatar} />
            ) : details.webCard ? (
              <CoverRenderer width={AVATAR_WIDTH} webCard={details.webCard} />
            ) : (
              <Text style={styles.initials}>
                {details.firstName?.substring(0, 1)}
                {details.lastName?.substring(0, 1)}
                {!details.firstName &&
                  !details.lastName &&
                  details.company?.substring(0, 1)}
              </Text>
            )}
          </View>
        </View>
        <Text variant="large" style={styles.name}>
          {details.firstName} {details.lastName}
        </Text>
        {details.company && (
          <Text style={styles.company}>{details.company}</Text>
        )}
        {details.jobTitle && <Text style={styles.job}>{details.jobTitle}</Text>}
        <View style={styles.saveContainer}>
          <Button
            label={intl.formatMessage({
              defaultMessage: "Save to my phone's contacts",
              description: 'ContactDetailsModal - Button to save contact',
            })}
            style={styles.save}
            onPress={onSave}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            {
              paddingBottom: bottom + HEADER,
            },
            styles.scroll,
          ]}
        >
          {details.phoneNumbers?.map((phoneNumber, index) => (
            <PressableNative
              key={'phone' + index + '' + phoneNumber.number}
              style={styles.item}
              onPress={() => {
                Linking.openURL(`tel:${phoneNumber.number}`);
              }}
            >
              <View style={styles.label}>
                <Icon icon="mobile" />
                <Text variant="smallbold">{phoneNumber.label}</Text>
              </View>
              <Text numberOfLines={1} style={styles.itemText}>
                {phoneNumber.number}
              </Text>
            </PressableNative>
          ))}
          {details.emails?.map((email, index) => (
            <PressableNative
              key={'email' + index + '' + email.email}
              style={styles.item}
              onPress={() => {
                Linking.openURL(`mailto:${email.email}`);
              }}
            >
              <View style={styles.label}>
                <Icon icon="mail_line" />
                <Text variant="smallbold">{email.label}</Text>
              </View>
              <Text numberOfLines={1} style={styles.itemText}>
                {email.email}
              </Text>
            </PressableNative>
          ))}
          {birthday && (
            <PressableNative
              style={styles.item}
              key="birthday"
              onPress={async () => {
                openCalendar(
                  `${birthday.year}-${birthday.month + 1}-${birthday.day}`,
                );
              }}
            >
              <View style={styles.label}>
                <Icon icon="calendar" />
                <Text variant="smallbold">
                  <FormattedMessage
                    defaultMessage="Birthday"
                    description="ContactDetailsBody - Title for birthday"
                  />
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.itemText}>
                {new Date(
                  birthday.year ?? 0,
                  birthday.month,
                  birthday.day,
                ).toLocaleDateString(undefined, {
                  year: birthday.year ? 'numeric' : undefined,
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </PressableNative>
          )}
          {details.urlAddresses?.map((urlAddress, index) => (
            <PressableNative
              key={'url' + index + '' + urlAddress.url}
              style={styles.item}
              onPress={async () => {
                if (urlAddress.url) {
                  const route = await matchUrlWithRoute(urlAddress.url);
                  if (route) {
                    // will close the contact detail modal
                    router.back();
                    // move to route deeplink
                    router?.push(route);
                    return;
                  }
                  Linking.openURL(
                    urlAddress.url.startsWith('http')
                      ? urlAddress.url
                      : `https://${urlAddress.url}`,
                  );
                }
              }}
            >
              <View style={styles.label}>
                <Icon icon="link" />
                <Text variant="smallbold">
                  {urlAddress.label || (
                    <FormattedMessage
                      defaultMessage="Url"
                      description="ContactDetailsBody - Title for item URL with empty label"
                    />
                  )}
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.itemText}>
                {urlAddress.url}
              </Text>
            </PressableNative>
          ))}
          {details.addresses?.map((address, index) => (
            <PressableNative
              key={'street' + index + '' + address.street}
              style={styles.item}
              onPress={async () => {
                const url = Platform.select({
                  ios: `maps:0,0?q=${address.street}`,
                  android: `geo:0,0?q=${address.street}`,
                });

                if (url) {
                  Linking.openURL(url);
                } else {
                  console.warn(`${address.street} is not an adress`);
                }
              }}
            >
              <View style={styles.label}>
                <Icon icon="location" />
                <Text variant="smallbold">{address.label}</Text>
              </View>
              <Text numberOfLines={1} style={styles.itemText}>
                {address.street}
              </Text>
            </PressableNative>
          ))}
          {details.socialProfiles?.map((social, index) => (
            <PressableNative
              key={'social' + index + '' + social.url}
              style={styles.item}
              onPress={() => {
                if (social.url) {
                  Linking.openURL(getSocialUrl(social.url));
                }
              }}
            >
              <View style={styles.label}>
                <SocialIcon
                  icon={social.label as SocialLinkId}
                  style={styles.social}
                />
                <Text variant="smallbold">{social.label}</Text>
              </View>
              <Text numberOfLines={1} style={styles.itemText}>
                {social.url}
              </Text>
            </PressableNative>
          ))}
          <View style={styles.item} key="scanDate">
            <View style={styles.label}>
              <Icon icon="calendar" />
              <Text variant="smallbold">
                <FormattedMessage
                  defaultMessage="Date of Contact"
                  description="ContactDetailsModal - Label for date item"
                />
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.itemText}>
              {date}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Container>
  );
};

const openCalendar = (date: string) => {
  const birthDate = new Date(date).setFullYear(new Date().getFullYear());
  if (Platform.OS === 'ios') {
    const from = new Date('2001-01-01').getTime() / 1000;
    const seconds = Math.floor(birthDate / 1000) - from;
    Linking.openURL('calshow:' + seconds);
  } else if (Platform.OS === 'android') {
    Linking.openURL('content://com.android.calendar/time/' + birthDate);
  }
};

const getSocialUrl = (url: string) =>
  url.startsWith('http') ? url : `https://${url}`;

const AVATAR_WIDTH = 112;

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: theme === 'dark' ? colors.grey1000 : 'white',
  },
  close: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  share: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  shareIcon: { transform: [{ rotateZ: '30deg' }] },
  name: {
    marginTop: 20,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 20,
  },
  company: {
    marginTop: 5,
  },
  job: {
    marginTop: 5,
    color: colors.grey400,
  },
  saveContainer: {
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 10,
  },
  save: {
    marginTop: 20,
    width: '100%',
  },
  item: {
    width: '100%',
    height: 52,
    ...shadow(theme, 'center'),
    marginTop: 20,
    padding: 14,
    backgroundColor: theme === 'dark' ? colors.grey900 : colors.white,
    borderRadius: 12,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemText: {
    flex: 1,
    textAlign: 'right',
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  avatarContainer: Platform.OS === 'ios' && {
    ...shadow(theme, 'bottom'),
  },
  avatarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadow(theme, 'bottom'),
    backgroundColor: 'white',
  },
  avatar: {
    width: AVATAR_WIDTH,
    height: AVATAR_WIDTH,
    borderRadius: AVATAR_WIDTH / 2,
    borderWidth: 4,
    borderColor: theme === 'dark' ? colors.black : colors.white,
    overflow: 'visible',
    backgroundColor: colors.grey50,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  initials: {
    color: colors.grey300,
    fontSize: 50,
    fontWeight: 500,
    lineHeight: 60,
    textTransform: 'uppercase',
  },
  social: {
    width: 24,
    height: 24,
  },
}));

const HEADER = 300;

export type ContactDetails = Contact & {
  createdAt: Date;
  profileId?: string;
  webCard?: CoverRenderer_webCard$key | null;
};

export default ContactDetailsBody;
