import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Linking, Platform, useColorScheme, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { graphql, useFragment } from 'react-relay';
import { colors, shadow } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import { getFriendlyNameFromLocation } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import { getLocalCachedMediaFile } from '#helpers/mediaHelpers/remoteMediaCache';
import ShareContact from '#helpers/ShareContact';
import useBoolean from '#hooks/useBoolean';
import useRemoveContact from '#hooks/useRemoveContact';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon, { SocialIcon } from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactDetailActionModal from './ContactDetailActionModal';
import NoteItem from './NoteItem';
import type { ContactType } from '#helpers/contactTypes';
import type { ContactDetailsBody_webCard$key } from '#relayArtifacts/ContactDetailsBody_webCard.graphql';
import type { CoverRenderer_webCard$key } from '#relayArtifacts/CoverRenderer_webCard.graphql';
import type { Icons } from '#ui/Icon';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';

const BLUR_GAP = 20;

type ContactDetailsBodyProps = {
  contact: ContactType;
  onClose: () => void;
  onSave: () => void;
};

const ContactDetailItem = ({
  onPress,
  icon,
  label,
  content,
  iconComponent,
}: {
  onPress?: () => void;
  icon?: Icons;
  label?: string;
  content?: string;
  iconComponent?: JSX.Element;
}) => {
  const styles = useStyleSheet(stylesheet);

  return (
    <View style={styles.item}>
      <PressableNative onPress={onPress} style={styles.pressable}>
        <View style={styles.label}>
          {iconComponent ? (
            iconComponent
          ) : icon ? (
            <Icon icon={icon} />
          ) : undefined}
          <Text variant="smallbold">{label}</Text>
        </View>
        <Text numberOfLines={1} style={styles.itemText}>
          {content}
        </Text>
      </PressableNative>
    </View>
  );
};

const ContactDetailsBody = ({
  contact,
  onSave,
  onClose,
}: ContactDetailsBodyProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(stylesheet);
  const router = useRouter();

  const [isMoreVisible, showMore, hideMore] = useBoolean(false);

  const webCard = useFragment(
    graphql`
      fragment ContactDetailsBody_webCard on WebCard
      @argumentDefinitions(
        pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
        cappedPixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
        screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
      ) {
        id
        ...CoverRenderer_webCard
        coverMedia {
          id
          __typename
          ... on MediaVideo {
            uri(width: $screenWidth, pixelRatio: $pixelRatio)
            thumbnail(width: $screenWidth, pixelRatio: $pixelRatio)
            smallThumbnail: thumbnail(width: 125, pixelRatio: $cappedPixelRatio)
          }
        }
      }
    `,
    contact?.webCard as ContactDetailsBody_webCard$key,
  );

  const avatarUrl = useMemo(() => {
    if (contact?.avatar) {
      if (contact?.avatar?.id) {
        const localFile = getLocalCachedMediaFile(contact.avatar.id, 'image');
        if (localFile) {
          return localFile;
        }
      }
      if (contact?.avatar?.uri) {
        return contact.avatar.uri;
      }
    }
    if (contact?.logo) {
      if (contact?.logo?.id) {
        const localFile = getLocalCachedMediaFile(contact.logo.id, 'image');
        if (localFile) {
          return localFile;
        }
      }
      return contact.logo.uri;
    }
    return undefined;
  }, [contact.avatar, contact.logo]);

  const birthday = contact?.birthday;

  const onShare = async () => contact && ShareContact(contact);
  const appearance = useColorScheme();

  const { width: screenWidth } = useScreenDimensions();
  const { top, bottom } = useScreenInsets();

  const backgroundWidth = screenWidth + BLUR_GAP * 2;
  const backgroundImageUrl = useMemo(() => {
    if (contact?.logo) {
      if (contact?.logo?.id) {
        const localFile = getLocalCachedMediaFile(contact.logo.id, 'image');
        if (localFile) {
          return localFile;
        }
      }
      return contact.logo.uri;
    }
    if (contact?.avatar) {
      if (contact?.avatar?.id) {
        const localFile = getLocalCachedMediaFile(contact.avatar.id, 'image');
        if (localFile) {
          return localFile;
        }
      }
      if (contact?.avatar?.uri) {
        return contact.avatar.uri;
      }
    }
    if (contact?.webCardPreview?.id) {
      const localFile = getLocalCachedMediaFile(
        contact.webCardPreview.id,
        'image',
      );
      if (localFile) {
        return localFile;
      }
    }
    return contact?.webCardPreview?.uri ?? undefined;
  }, [
    contact?.logo,
    contact?.avatar,
    contact?.webCardPreview?.id,
    contact?.webCardPreview?.uri,
  ]);

  const meetingPlace = contact?.meetingPlace
    ? getFriendlyNameFromLocation(contact.meetingPlace)
    : undefined;
  const meetingDate = contact.meetingDate
    ? new Date(contact.meetingDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : undefined;

  const removeContact = useRemoveContact({
    onCompleted: () => {
      hideMore();
      router.back();
    },
    onError: e => {
      console.error('Error removing contact', e);
    },
  });

  const onRemoveContacts = useCallback(() => {
    if (!contact.id) {
      return;
    }
    removeContact([contact.id]);
  }, [contact.id, removeContact]);

  const onEditContact = useCallback(() => {
    hideMore();
    router.push({
      route: 'CONTACT_EDIT',
      params: {
        contact,
      },
    });
  }, [contact, hideMore, router]);

  return (
    <Container style={styles.container}>
      {backgroundImageUrl ? (
        <View
          style={[styles.avatarBackgroundContainer, { width: backgroundWidth }]}
        >
          <Image
            source={backgroundImageUrl}
            style={styles.avatarBackground}
            blurRadius={8.2}
            contentFit="cover"
          />
          <LinearGradient
            colors={[
              appearance === 'dark' ? 'transparent' : 'rgba(255, 255, 255, 0)',
              appearance === 'dark' ? colors.grey1000 : colors.white,
            ]}
            start={{ x: 0, y: 0.1 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.avatarBackgroundGradient,
              { width: backgroundWidth },
            ]}
          />
        </View>
      ) : undefined}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: top, paddingBottom: bottom + 100 },
        ]}
      >
        <View style={styles.content}>
          <PressableNative style={styles.close} onPress={onClose}>
            <Icon icon="close" size={24} />
          </PressableNative>
          <PressableNative style={styles.share} onPress={onShare}>
            <Icon icon="share" size={24} style={styles.shareIcon} />
          </PressableNative>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, styles.avatarWrapper]}>
              {avatarUrl ? (
                <Image source={avatarUrl} style={styles.avatar} />
              ) : webCard ? (
                <CoverRenderer
                  width={AVATAR_WIDTH}
                  webCard={contact.webCard as CoverRenderer_webCard$key}
                />
              ) : (
                <Text style={styles.initials}>
                  {contact.firstName?.substring(0, 1)}
                  {contact.lastName?.substring(0, 1)}
                  {!contact.firstName &&
                    !contact.lastName &&
                    contact.company?.substring(0, 1)}
                </Text>
              )}
            </View>
          </View>
          <Text variant="large" style={styles.name}>
            {`${contact?.firstName ?? ''} ${contact?.lastName ?? ''}`.trim()}
          </Text>
          {contact.company && (
            <Text style={styles.company}>{contact.company}</Text>
          )}
          {contact.title && <Text style={styles.job}>{contact.title}</Text>}
          <View style={styles.saveContainer}>
            <Button
              label={intl.formatMessage({
                defaultMessage: "Save to my phone's contacts",
                description: 'ContactDetailsModal - Button to save contact',
              })}
              style={styles.save}
              onPress={onSave}
            />
            <Button
              leftElement={
                <Icon
                  icon="more"
                  style={styles.more}
                  tintColor={
                    appearance === 'dark' ? colors.black : colors.white
                  }
                  size={24}
                />
              }
              textStyle={styles.moreContent}
              style={styles.more}
              onPress={showMore}
            />
          </View>
          {meetingDate && (
            <Text variant="small" style={{ color: colors.grey200 }}>
              {meetingPlace
                ? intl.formatMessage(
                    {
                      defaultMessage: 'Connected in {location} on {date}',
                      description:
                        'ContactDetailsModal - Connected label with location and date',
                    },
                    {
                      location: meetingPlace,
                      date: meetingDate,
                    },
                  )
                : intl.formatMessage(
                    {
                      defaultMessage: 'Connected on {date}',
                      description:
                        'ContactDetailsModal - Connected label with date',
                    },
                    {
                      date: meetingDate,
                    },
                  )}
            </Text>
          )}
          <NoteItem contact={contact} />
          {contact.phoneNumbers?.map((phoneNumber, index) => (
            <ContactDetailItem
              key={'phone' + index + '' + phoneNumber.number}
              onPress={() => {
                Linking.openURL(`tel:${phoneNumber.number}`);
              }}
              icon="mobile"
              label={phoneNumber.label}
              content={phoneNumber.number}
            />
          ))}
          {contact.emails?.map((email, index) => (
            <ContactDetailItem
              key={'email' + index + '' + email.address}
              onPress={() => {
                Linking.openURL(`mailto:${email.address}`);
              }}
              icon="mail_line"
              label={email.label}
              content={email.address}
            />
          ))}
          {birthday && (
            <ContactDetailItem
              key="birthday"
              onPress={async () => {
                openCalendar(birthday);
              }}
              icon="calendar"
              label={intl.formatMessage({
                defaultMessage: 'Birthday',
                description: 'ContactDetailsBody - Title for birthday',
              })}
              content={new Date(birthday).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          )}
          {contact.urls?.map((urlAddress, index) => (
            <ContactDetailItem
              key={'url' + index + '' + urlAddress.url}
              onPress={async () => {
                if (urlAddress.url) {
                  const route = await matchUrlWithRoute(urlAddress.url);
                  if (route) {
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
              icon="link"
              label={intl.formatMessage({
                defaultMessage: 'Url',
                description:
                  'ContactDetailsBody - Title for item URL with empty label',
              })}
              content={urlAddress.url}
            />
          ))}
          {contact.addresses?.map((address, index) => (
            <ContactDetailItem
              key={'street' + index + '' + address.address}
              onPress={async () => {
                const url = Platform.select({
                  ios: `maps:0,0?q=${address.address}`,
                  android: `geo:0,0?q=${address.address}`,
                });

                if (url) {
                  Linking.openURL(url);
                } else {
                  console.warn(`${address.address} is not an adress`);
                }
              }}
              icon="location"
              label={address.label}
              content={address.address}
            />
          ))}
          {contact.socials?.map((social, index) => (
            <ContactDetailItem
              key={'social' + index + '' + social.url}
              onPress={() => {
                if (social.url) {
                  Linking.openURL(getSocialUrl(social.url));
                }
              }}
              iconComponent={
                <SocialIcon
                  icon={social.label as SocialLinkId}
                  style={styles.social}
                />
              }
              label={social.label}
              content={social.url}
            />
          ))}
        </View>
      </ScrollView>
      {contact ? (
        <ContactDetailActionModal
          visible={isMoreVisible}
          close={hideMore}
          onRemoveContacts={onRemoveContacts}
          onSaveContact={onSave}
          onShare={onShare}
          details={contact}
          onEdit={onEditContact}
        />
      ) : undefined}
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

const stylesheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: appearance === 'dark' ? colors.grey1000 : colors.white,
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
  pressable: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'visible',
  },
  company: {
    marginTop: 5,
  },
  job: {
    marginTop: 5,
    color: colors.grey400,
  },
  saveContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingBottom: 10,
    marginTop: 20,
    gap: 5,
  },
  save: {
    flex: 1,
  },
  more: {
    width: 50,
  },
  moreContent: { transform: [{ scale: 1.5 }] },
  item: {
    width: '100%',
    height: 52,
    ...shadow({ appearance, direction: 'center' }),
    marginTop: 15,
    padding: 14,
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.white,
    borderRadius: 12,
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
    borderRadius: AVATAR_WIDTH / 2,
    ...shadow({ appearance, direction: 'bottom' }),
    paddingTop: 30,
  },
  avatarBackgroundContainer: {
    top: -BLUR_GAP,
    left: -BLUR_GAP,
    position: 'absolute',
    height: 387,
  },
  avatarBackground: {
    flex: 1,
  },
  avatarBackgroundGradient: {
    position: 'absolute',
    height: 387,
  },
  avatarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadow({ appearance, direction: 'bottom' }),
    backgroundColor: 'white',
  },
  avatar: {
    width: AVATAR_WIDTH,
    height: AVATAR_WIDTH,
    borderRadius: AVATAR_WIDTH / 2,
    borderWidth: 4,
    borderColor: appearance === 'dark' ? colors.black : colors.white,
    overflow: 'visible',
    backgroundColor: colors.grey50,
  },
  scroll: {
    marginHorizontal: 20,
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

export default ContactDetailsBody;
