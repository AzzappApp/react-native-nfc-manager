import { Image } from 'expo-image';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { Contact } from 'expo-contacts';

type Props = {
  details: ContactDetails;
  onClose: () => void;
  onSave: () => void;
};

const ContactDetailsBody = ({ details, onSave, onClose }: Props) => {
  const { bottom } = useSafeAreaInsets();
  const intl = useIntl();
  const styles = useStyleSheet(stylesheet);

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

  return (
    <Container style={styles.container}>
      <PressableNative style={styles.close} onPress={onClose}>
        <Icon icon="close" size={24} />
      </PressableNative>
      {/* <PressableNative style={styles.share}>
            <Icon icon="share" size={24} />
          </PressableNative> */}
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, styles.avatarWrapper]}>
            {avatar ? (
              <Image source={avatar} style={styles.avatar} />
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
          {details.phoneNumbers?.map(phoneNumber => (
            <PressableNative
              key={phoneNumber.number}
              style={styles.item}
              onPress={() => {
                Linking.openURL(`tel:${phoneNumber.number}`);
              }}
            >
              <View style={styles.label}>
                <Icon icon="mobile" />
                <Text variant="smallbold">{phoneNumber.label}</Text>
              </View>
              <Text>{phoneNumber.number}</Text>
            </PressableNative>
          ))}
          {details.emails?.map(email => (
            <PressableNative
              key={email.email}
              style={styles.item}
              onPress={() => {
                Linking.openURL(`mailto:${email.email}`);
              }}
            >
              <View style={styles.label}>
                <Icon icon="mail_line" />
                <Text variant="smallbold">{email.label}</Text>
              </View>
              <Text>{email.email}</Text>
            </PressableNative>
          ))}
          <View style={styles.item}>
            <View style={styles.label}>
              <Icon icon="calendar" />
              <Text variant="smallbold">
                <FormattedMessage
                  defaultMessage="Date"
                  description="ContactDetailsModal - Label for date item"
                />
              </Text>
            </View>
            <Text>{date}</Text>
          </View>
        </ScrollView>
      </View>
    </Container>
  );
};

const AVATAR_WIDTH = 112;

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: theme === 'dark' ? colors.grey1000 : 'white',
  },
  close: {
    position: 'absolute',
    top: 0,
    left: 20,
  },
  share: {
    position: 'absolute',
    top: 0,
    right: 20,
  },
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
}));

const HEADER = 300;

export type ContactDetails = Contact & {
  createdAt: Date;
  profileId?: string;
};

export default ContactDetailsBody;
