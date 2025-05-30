import { zodResolver } from '@hookform/resolvers/zod';
import * as Sentry from '@sentry/react-native';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { Keyboard, Platform, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useMutation, usePreloadedQuery } from 'react-relay';
import { graphql, Observable } from 'relay-runtime';
import { combineMultiUploadProgresses } from '@azzapp/shared/networkHelpers';
import { colors } from '#theme';
import ContactForm from '#components/Contact/ContactForm';
import FormDeleteFieldOverlay from '#components/FormDeleteFieldOverlay';
import {
  preventModalDismiss,
  ScreenModal,
  useRouter,
} from '#components/NativeRouter';
import {
  addContactUpdater,
  contactSchema,
  removeContactUpdater,
} from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  prepareAvatarForUpload,
  prepareLogoForUpload,
} from '#helpers/imageHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia } from '#helpers/MobileWebAPI';

import {
  extractPhoneNumberDetails,
  getPhonenumberWithCountryCode,
} from '#helpers/phoneNumbersHelper';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import { get as PixelRatio } from '#relayProviders/PixelRatio.relayprovider';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import UploadProgressModal from '#ui/UploadProgressModal';
import type { ScreenOptions } from '#components/NativeRouter';
import type { contactFormValues } from '#helpers/contactHelpers';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactEditScreenMutation } from '#relayArtifacts/ContactEditScreenMutation.graphql';
import type { ContactEditScreenQuery } from '#relayArtifacts/ContactEditScreenQuery.graphql';
import type { ContactEditRoute } from '#routes';
import type { CountryCode } from 'libphonenumber-js';
import type { ScrollView } from 'react-native';

const contactEditScreenQuery = graphql`
  query ContactEditScreenQuery($contactId: ID!, $pixelRatio: Float!) {
    node(id: $contactId) {
      ... on Contact @alias(as: "contact") {
        id
        firstName
        lastName
        birthday
        company
        title
        note
        meetingDate
        avatar {
          uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
          id
        }
        addresses {
          address
          label
        }
        logo {
          uri: uri(width: 180, pixelRatio: $pixelRatio, format: png)
          id
        }
        phoneNumbers {
          number
          label
        }
        emails {
          address
          label
        }
        urls {
          url
        }
        socials {
          url
          label
        }
        enrichment {
          id
          fields {
            birthday
            company
            title
            avatar {
              uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
              id
            }
            addresses {
              address
              label
            }
            logo {
              uri: uri(width: 180, pixelRatio: $pixelRatio, format: png)
            }
            phoneNumbers {
              number
              label
            }
            emails {
              address
              label
            }
            urls {
              url
            }
            socials {
              url
              label
            }
          }
        }
      }
    }
  }
`;

const ContactEditScreen = ({
  preloadedQuery,
}: RelayScreenProps<ContactEditRoute, ContactEditScreenQuery>) => {
  const scrollRef = useRef<ScrollView>(null);
  const styles = useStyleSheet(stylesheet);

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const intl = useIntl();
  const router = useRouter();
  const { node } = usePreloadedQuery(contactEditScreenQuery, preloadedQuery);

  const [commit, loading] = useMutation<ContactEditScreenMutation>(graphql`
    mutation ContactEditScreenMutation(
      $contactId: ID!
      $contactEnrichmentId: ID!
      $contact: ContactInput!
      $hiddenFields: HiddenFieldInput!
      $pixelRatio: Float!
    ) {
      updateContactEnrichmentHiddenFields(
        contactEnrichmentId: $contactEnrichmentId
        input: $hiddenFields
      ) {
        contactEnrichment {
          id
          fields {
            birthday
            company
            title
            avatar {
              uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
              id
            }
            addresses {
              address
              label
            }
            logo {
              uri: uri(width: 180, pixelRatio: $pixelRatio, format: png)
              id
            }
            phoneNumbers {
              number
              label
            }
            emails {
              address
              label
            }
            urls {
              url
            }
            socials {
              url
              label
            }
          }
        }
      }
      saveContact(contactId: $contactId, input: $contact) {
        id
        ...ContactActionModal_contact
        ...ContactsHorizontalList_contacts
        ...ContactDetailsBody_contact
        ...ContactsListItem_contact
      }
    }
  `);

  const contact = node?.contact;
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<contactFormValues>({
    mode: 'onBlur',
    shouldFocusError: true,
    resolver: zodResolver(contactSchema),
    defaultValues: {
      avatar: {
        uri:
          contact?.enrichment?.fields?.avatar?.uri ||
          contact?.avatar?.uri ||
          '',
      },
      firstName: contact?.firstName,
      lastName: contact?.lastName,
      title: contact?.enrichment?.fields?.title ?? contact?.title,
      company: contact?.enrichment?.fields?.company ?? contact?.company,
      logo: contact?.logo,
      phoneNumbers: [
        ...(contact?.phoneNumbers.map(({ label, number }) => {
          const { countryCode, number: parsedPhoneNumber } =
            extractPhoneNumberDetails(number);
          return {
            label:
              Platform.OS === 'android' && label === 'Fax' ? 'otherFax' : label,
            number: parsedPhoneNumber || number,
            countryCode,
          };
        }) || []),
        ...(contact?.enrichment?.fields?.phoneNumbers?.map(
          ({ label, number }) => {
            const { countryCode, number: parsedPhoneNumber } =
              extractPhoneNumberDetails(number);
            return {
              label:
                Platform.OS === 'android' && label === 'Fax'
                  ? 'otherFax'
                  : label,
              number: parsedPhoneNumber || number,
              countryCode,
              fromEnrichment: true,
            };
          },
        ) || []),
      ],
      emails: [
        ...(contact?.emails?.map(({ address, label }) => ({
          address,
          label,
        })) ?? []),
        ...(contact?.enrichment?.fields?.emails?.map(({ address, label }) => ({
          address,
          label,
          fromEnrichment: true,
        })) ?? []),
      ],
      urls: [
        ...(contact?.urls?.map(({ url }) => ({ url })) ?? []),
        ...(contact?.enrichment?.fields?.urls?.map(({ url }) => ({
          url,
          fromEnrichment: true,
        })) ?? []),
      ],
      addresses: [
        ...(contact?.addresses?.map(({ address, label }) => ({
          address,
          label,
        })) ?? []),
        ...(contact?.enrichment?.fields?.addresses?.map(
          ({ address, label }) => ({
            address,
            label,
            fromEnrichment: true,
          }),
        ) ?? []),
      ],
      birthday: {
        birthday: contact?.enrichment?.fields?.birthday ?? contact?.birthday,
      },
      socials: [
        ...(contact?.socials?.map(({ label, url }) => ({ label, url })) ?? []),
        ...(contact?.enrichment?.fields?.socials?.map(({ label, url }) => ({
          label,
          url,
          fromEnrichment: true,
        })) ?? []),
      ],
      note: contact?.note,
      meetingDate: contact?.meetingDate
        ? new Date(contact?.meetingDate)
        : new Date(),
    },
  });

  const originalEnrichmentFields = useRef(contact?.enrichment?.fields);

  const submit = () => {
    Keyboard.dismiss();
    handleSubmit(async ({ avatar, logo, ...data }) => {
      if (!contact?.id) {
        return;
      }

      const isEnrichedAvatar =
        contact?.enrichment?.fields?.avatar?.uri &&
        avatar?.uri === contact?.enrichment?.fields?.avatar?.uri;

      const uploads = [];

      if (avatar?.local && avatar.uri && !isEnrichedAvatar) {
        const { file, uploadURL, uploadParameters } =
          await prepareAvatarForUpload(avatar.uri);

        uploads.push(uploadMedia(file, uploadURL, uploadParameters));
      } else {
        uploads.push(null);
      }

      let logoUri;
      if (logo?.local && logo.uri) {
        try {
          const { file, uploadURL, uploadParameters } =
            await prepareLogoForUpload(logo.uri);
          logoUri = file.uri;
          uploads.push(uploadMedia(file, uploadURL, uploadParameters));
        } catch (e) {
          Sentry.captureException(e);
          uploads.push(null);
        }
      } else {
        uploads.push(null);
      }

      const uploadsToDo = uploads.filter(val => val !== null);

      if (uploadsToDo.length) {
        setProgressIndicator(Observable.from(0));
        setProgressIndicator(
          combineMultiUploadProgresses(
            uploadsToDo.map(upload => upload.progress),
          ),
        );
      }

      const [uploadedAvatarId, uploadedLogoId] = await Promise.all(
        uploads.map(upload =>
          upload?.promise.then(({ public_id }) => {
            return public_id;
          }),
        ),
      );

      const avatarId =
        avatar === null ? null : avatar?.local ? uploadedAvatarId : avatar?.id;

      const logoId =
        logo === null ? null : logo?.local ? uploadedLogoId : logo?.id;

      if (avatar?.local) {
        addLocalCachedMediaFile(avatarId, 'image', avatar.uri);
      }

      if (logoUri) {
        addLocalCachedMediaFile(logoId, 'image', logoUri);
      }

      const isEnrichedTitle =
        contact?.enrichment?.fields?.title &&
        data.title === contact?.enrichment?.fields?.title;

      const isEnrichedCompany =
        contact?.enrichment?.fields?.company &&
        data.company === contact?.enrichment?.fields?.company;

      const isEnrichedBirthday =
        contact?.enrichment?.fields?.birthday &&
        data.birthday === contact?.enrichment?.fields?.birthday;

      const hiddenFields = {
        contact: {
          title: !isEnrichedTitle,
          company: !isEnrichedCompany,
          avatarId: !isEnrichedAvatar,
          birthday: !isEnrichedBirthday,
          emails: generateBooleanArrays(
            originalEnrichmentFields.current?.emails || [],
            data.emails.filter(
              email => email.fromEnrichment && !email.removedFromEnrichment,
            ),
          ),
          phoneNumbers: generateBooleanArrays(
            originalEnrichmentFields.current?.phoneNumbers || [],
            data.phoneNumbers.filter(
              phoneNumber =>
                phoneNumber.fromEnrichment &&
                !phoneNumber.removedFromEnrichment,
            ),
          ),
          urls: generateBooleanArrays(
            originalEnrichmentFields.current?.urls || [],
            data.urls.filter(
              url => url.fromEnrichment && !url.removedFromEnrichment,
            ),
          ),
          addresses: generateBooleanArrays(
            originalEnrichmentFields.current?.addresses || [],
            data.addresses.filter(
              address =>
                address.fromEnrichment && !address.removedFromEnrichment,
            ),
          ),
          socials: generateBooleanArrays(
            originalEnrichmentFields.current?.socials || [],
            data.socials.filter(
              social => social.fromEnrichment && !social.removedFromEnrichment,
            ),
          ),
        },
      };

      commit({
        variables: {
          contactId: contact.id,
          hiddenFields,
          contactEnrichmentId: contact.enrichment?.id || '',
          pixelRatio: PixelRatio(),
          contact: {
            avatarId,
            logoId,
            emails: data.emails?.length
              ? data.emails
                  .filter(
                    email =>
                      email.address &&
                      (!email.fromEnrichment || email.removedFromEnrichment),
                  )
                  .map(({ address, label }) => ({
                    address,
                    label,
                  }))
              : [],
            phoneNumbers: data.phoneNumbers?.length
              ? data.phoneNumbers
                  .filter(
                    phoneNumber =>
                      phoneNumber.number &&
                      (!phoneNumber.fromEnrichment ||
                        phoneNumber.removedFromEnrichment),
                  )
                  .map(({ countryCode, ...phoneNumber }) => {
                    const number = getPhonenumberWithCountryCode(
                      phoneNumber.number,
                      countryCode as CountryCode,
                    );
                    return { label: phoneNumber.label, number };
                  })
              : [],
            urls: data.urls
              .filter(url => !url.fromEnrichment || url.removedFromEnrichment)
              .map(({ url }) => ({
                url,
              })),
            addresses: data.addresses
              .filter(
                address =>
                  !address.fromEnrichment || address.removedFromEnrichment,
              )
              .map(({ address, label }) => ({
                address,
                label,
              })),
            socials: data.socials
              .filter(
                social =>
                  !social.fromEnrichment || social.removedFromEnrichment,
              )
              .map(({ label, url }) => ({
                label,
                url,
              })),
            company: data.company || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            title: data.title || '',
            birthday: data.birthday?.birthday,
            meetingDate: data.meetingDate?.toISOString(),
            note: data.note || '',
          },
        },
        updater: store => {
          const user = store.getRoot().getLinkedRecord('currentUser');
          const newContact = store.getRootField('saveContact');
          if (!user || !newContact) {
            return;
          }
          removeContactUpdater(store, user, newContact.getDataID());
          addContactUpdater(store, user, newContact);
        },
        onCompleted: () => {
          router.back();
        },
        onError: e => {
          console.error(e);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage:
                'Error, could not save your contact. Please try again.',
              description:
                'Error toast message when saving contact card failed',
            }) as unknown as string,
          });
          router.back();
        },
      });
    })();
  };

  useEffect(() => {
    return Toast.hide;
  }, []);
  const { bottom, top } = useScreenInsets();

  return (
    <>
      <Container style={[styles.container, { paddingTop: top }]}>
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Edit Contact',
            description: 'Edit Contact Card Modal title',
          })}
          leftElement={
            <HeaderButton
              variant="secondary"
              onPress={router.back}
              label={intl.formatMessage({
                defaultMessage: 'Cancel',
                description: 'Edit contact modal Cancel button label',
              })}
            />
          }
          rightElement={
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Save',
                description: 'Edit contact modal save button label',
              })}
              testID="save-contact-card"
              loading={isSubmitting || loading}
              onPress={submit}
              variant="primary"
              style={styles.headerButton}
              disabled={!isValid}
            />
          }
        />

        <FormDeleteFieldOverlay ref={scrollRef}>
          <View style={{ flex: 1, paddingBottom: bottom }}>
            <ContactForm control={control} />
          </View>
        </FormDeleteFieldOverlay>
        <ScreenModal
          visible={!!progressIndicator}
          gestureEnabled={false}
          onRequestDismiss={preventModalDismiss}
        >
          {progressIndicator && (
            <UploadProgressModal progressIndicator={progressIndicator} />
          )}
        </ScreenModal>
      </Container>
    </>
  );
};

const fieldsToIgnore = ['removedFromEnrichment', 'fromEnrichment'];

/*
 * Generates an array of booleans indicating whether each field has been validated
 * compared to the original enrichment fields.
 * If the field is already hidden in the original enrichment, let's keep it hidden.
 * If the field is not hidden and has not changed, it returns false.
 * If the field is not hidden and has changed, it returns true.
 * It allows to maintain and update correctly the hidden fields state
 */
const generateBooleanArrays = (
  originalEnrichmentFields?: Record<string, any>,
  data?: Record<string, any>,
) => {
  let dataIndex = 0;
  let originalIndex = 0;

  const result = originalEnrichmentFields?.map(() => {
    const dataItem = omit(data?.[dataIndex], fieldsToIgnore);
    const originItem = omit(
      originalEnrichmentFields?.[originalIndex],
      fieldsToIgnore,
    );

    if (isEqual(originItem, dataItem)) {
      // didn't change
      dataIndex += 1;
      originalIndex += 1;
      return false;
    }
    originalIndex += 1;
    return true;
  });
  return result;
};

const stylesheet = createStyleSheet(appearance => ({
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  container: { flex: 1 },
  popupContainer: {
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.white,
    width: 295,
    borderRadius: 20,
    alignSelf: 'center',
    padding: 20,
    alignContent: 'center',
  },
  popupIllustration: {
    height: 170,
    borderRadius: 12,
  },
  popupPage: { top: 0, width: '100%', paddingBottom: 20 },
  popupHeaderTextContainer: {
    color: appearance === 'dark' ? colors.white : colors.black,
    paddingTop: 20,
    textAlign: 'center',
  },
  popupDescriptionTextContainer: {
    color: appearance === 'dark' ? colors.white : colors.black,
    paddingTop: 10,
    textAlign: 'center',
  },
  leftArrowIcon: {
    borderWidth: 0,
  },
  scanButton: { marginHorizontal: 20, marginVertical: 10 },
}));

ContactEditScreen.getScreenOptions = (): ScreenOptions => ({
  stackAnimation: 'slide_from_bottom',
});

export default relayScreen(ContactEditScreen, {
  query: contactEditScreenQuery,
  getVariables: ({ contactId }) => ({
    contactId,
    pixelRatio: PixelRatio(),
  }),
});
