import { useIntl } from 'react-intl';
import {
  Linking,
  Platform,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import Button from '#ui/Button';
import Icon, { SocialIcon } from '#ui/Icon';
import Text from '#ui/Text';
import { ContactDetailAIFooter } from './ContactDetailAIFooter';
import { ContactDetailItem } from './ContactDetailItem';
import NoteItem from './NoteItem';
import type {
  ContactAddressType,
  ContactEmailType,
  ContactPhoneNumberType,
  ContactSocialType,
  ContactUrlType,
} from '#helpers/contactHelpers';
import type { ContactDetailFragmentContact_contact$key } from '#relayArtifacts/ContactDetailFragmentContact_contact.graphql';
import type {
  ContactDetailEnrichState,
  HiddenFields,
} from './ContactDetailsBody';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';

export const ContactDetailFragmentContact = ({
  onSave,
  showMore,
  state,
  onRemoveField,
  hiddenFields,
  contact: contactKey,
}: {
  onSave: () => void;
  showMore: () => void;
  state: ContactDetailEnrichState;
  onRemoveField: (field: string, index?: number) => void;
  hiddenFields: HiddenFields;
  contact?: ContactDetailFragmentContact_contact$key | null;
}) => {
  const intl = useIntl();
  const appearance = useColorScheme();
  const router = useRouter();

  const data = useFragment(
    graphql`
      fragment ContactDetailFragmentContact_contact on Contact {
        ...NoteItem_contact
        meetingDate
        meetingPlaceFriendlyName
        birthday
        phoneNumbers {
          label
          number
        }
        emails {
          label
          address
        }
        urls {
          url
        }
        socials {
          label
          url
        }
        addresses {
          label
          address
        }
        enrichment {
          approved
          fields {
            birthday
            phoneNumbers {
              label
              number
            }
            emails {
              label
              address
            }
            urls {
              url
            }
            socials {
              label
              url
            }
            addresses {
              label
              address
            }
          }
        }
      }
    `,
    contactKey,
  );

  const meetingDate = data?.meetingDate
    ? new Date(data?.meetingDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : undefined;

  const displayedBirthday = !hiddenFields.contact.birthday
    ? data?.enrichment?.fields?.birthday || data?.birthday
    : data?.birthday;

  /// SOCIALS
  const onPressSocialLink = (social: ContactSocialType) => () => {
    if (social.url) {
      Linking.openURL(getSocialUrl(social.url));
    }
  };
  const renderIconSocialComponent = (social: ContactSocialType) => {
    return (
      <SocialIcon
        icon={social.label as SocialLinkId}
        style={[
          styles.social,
          state === 'waitingApproval' ? styles.socialWhite : undefined,
        ]}
      />
    );
  };
  /// ADDRESS
  const onPressAddressLink =
    (address: Pick<ContactAddressType, 'address'>) => async () => {
      const url = Platform.select({
        ios: `maps:0,0?q=${address.address}`,
        android: `geo:0,0?q=${address.address}`,
      });

      if (url) {
        Linking.openURL(url);
      } else {
        console.warn(`${address.address} is not an address`);
      }
    };

  /// URL
  const onPressURLLink = (urlAddress: ContactUrlType) => async () => {
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
  };

  /// EMAIL
  const onPressEmailLink =
    (email: Pick<ContactEmailType, 'address'>) => async () => {
      Linking.openURL(`mailto:${email.address}`);
    };

  // PHONE
  const onPressPhoneLink =
    (phoneNumber: Pick<ContactPhoneNumberType, 'number'>) => async () => {
      Linking.openURL(`tel:${phoneNumber.number}`);
    };

  return (
    <View style={styles.container}>
      <View style={styles.saveContainer}>
        <Button
          label={intl.formatMessage({
            defaultMessage: "Save to my phone's contacts",
            description: 'ContactDetailsModal - Button to save contact',
          })}
          style={styles.flex}
          onPress={onSave}
          disabled={state === 'waitingApproval'}
        />
        <Button
          leftElement={
            <Icon
              icon="more"
              style={styles.more}
              tintColor={appearance === 'dark' ? colors.black : colors.white}
              size={24}
            />
          }
          disabled={state === 'waitingApproval'}
          textStyle={styles.moreContent}
          style={styles.more}
          onPress={showMore}
        />
      </View>
      {meetingDate && (
        <Text variant="small" style={styles.meetingDate}>
          {data?.meetingPlaceFriendlyName
            ? intl.formatMessage(
                {
                  defaultMessage: 'Connected in {location} on {date}',
                  description:
                    'ContactDetailsModal - Connected label with location and date',
                },
                {
                  location: data?.meetingPlaceFriendlyName,
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
      <NoteItem contact={data} />
      {data?.phoneNumbers?.map((phoneNumber, index) => (
        <ContactDetailItem
          key={'phone' + index + '' + phoneNumber.number}
          onPress={onPressPhoneLink(phoneNumber)}
          icon="mobile"
          label={phoneNumber.label}
          content={phoneNumber.number}
        />
      ))}
      {data?.enrichment?.fields?.phoneNumbers?.map((phoneNumber, index) =>
        hiddenFields?.contact.phoneNumbers?.[index] ? null : (
          <ContactDetailItem
            key={'phone' + index + '' + phoneNumber.number}
            onPress={onPressPhoneLink(phoneNumber)}
            icon="mobile"
            label={phoneNumber.label}
            content={phoneNumber.number}
            isEnrichedItem
            state={state}
            onRemoveField={() => onRemoveField('phoneNumber', index)}
          />
        ),
      )}

      {data?.emails?.map((email, index) => (
        <ContactDetailItem
          key={'email' + index + '' + email.address}
          onPress={onPressEmailLink(email)}
          icon="mail_line"
          label={email.label}
          content={email.address}
        />
      ))}
      {data?.enrichment?.fields?.emails?.map((email, index) =>
        hiddenFields?.contact.emails?.[index] ? null : (
          <ContactDetailItem
            key={'email' + index + '' + email.address}
            onPress={onPressEmailLink(email)}
            icon="mail_line"
            label={email.label}
            content={email.address}
            isEnrichedItem
            state={state}
            onRemoveField={() => onRemoveField('emails', index)}
          />
        ),
      )}
      {displayedBirthday && (
        <ContactDetailItem
          key="birthday"
          onPress={async () => {
            openCalendar(displayedBirthday);
          }}
          icon="calendar"
          label={intl.formatMessage({
            defaultMessage: 'Birthday',
            description: 'ContactDetailsBody - Title for birthday',
          })}
          content={new Date(displayedBirthday).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          isEnrichedItem={
            !hiddenFields.contact.birthday &&
            !!data?.enrichment?.fields?.birthday
          }
          state={state}
          onRemoveField={() => onRemoveField('birthday')}
        />
      )}
      {data?.urls?.map((urlAddress, index) => (
        <ContactDetailItem
          key={'url' + index + '' + urlAddress.url}
          onPress={onPressURLLink(urlAddress)}
          icon="link"
          label={intl.formatMessage({
            defaultMessage: 'Url',
            description:
              'ContactDetailsBody - Title for item URL with empty label',
          })}
          content={urlAddress.url}
        />
      ))}
      {data?.enrichment?.fields?.urls?.map((urlAddress, index) =>
        hiddenFields?.contact.urls?.[index] ? null : (
          <ContactDetailItem
            key={'url' + index + '' + urlAddress.url}
            onPress={onPressURLLink(urlAddress)}
            icon="link"
            label={intl.formatMessage({
              defaultMessage: 'Url',
              description:
                'ContactDetailsBody - Title for item URL with empty label',
            })}
            content={urlAddress.url}
            isEnrichedItem
            state={state}
            onRemoveField={() => onRemoveField('urls', index)}
          />
        ),
      )}
      {data?.addresses?.map((address, index) => (
        <ContactDetailItem
          key={'street' + index + '' + address.address}
          onPress={onPressAddressLink(address)}
          icon="location"
          label={address.label}
          content={address.address}
        />
      ))}
      {data?.enrichment?.fields?.addresses?.map((address, index) =>
        hiddenFields?.contact.addresses?.[index] ? null : (
          <ContactDetailItem
            key={'street' + index + '' + address.address}
            onPress={onPressAddressLink(address)}
            icon="location"
            label={address.label}
            content={address.address}
            isEnrichedItem
            state={state}
            onRemoveField={() => onRemoveField('addresses', index)}
          />
        ),
      )}
      {data?.socials?.map((social, index) => (
        <ContactDetailItem
          key={'social' + index + '' + social.url}
          onPress={onPressSocialLink(social)}
          iconComponent={renderIconSocialComponent(social)}
          label={social.label}
          content={social.url}
        />
      ))}
      {data?.enrichment?.fields?.socials?.map((social, index) =>
        hiddenFields?.contact.socials?.[index] ? null : (
          <ContactDetailItem
            key={'social' + index + '' + social.url}
            onPress={onPressSocialLink(social)}
            iconComponent={renderIconSocialComponent(social)}
            label={social.label}
            content={social.url}
            isEnrichedItem
            state={state}
            onRemoveField={() => onRemoveField('socials', index)}
          />
        ),
      )}
      {data?.enrichment && <ContactDetailAIFooter />}
    </View>
  );
};

const getSocialUrl = (url: string) =>
  url.startsWith('http') ? url : `https://${url}`;

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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: { gap: 15, flex: 1, width: '100%' },
  saveContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingBottom: 10,
    marginTop: 20,
    gap: 5,
  },
  social: {
    width: 24,
    height: 24,
  },
  socialWhite: { tintColor: colors.white },
  more: {
    width: 50,
  },
  moreContent: { transform: [{ scale: 1.5 }] },
  meetingDate: { color: colors.grey200, textAlign: 'center' },
});
