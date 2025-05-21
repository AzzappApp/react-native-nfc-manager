import { zodResolver } from '@hookform/resolvers/zod';
import * as Sentry from '@sentry/react-native';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { Keyboard, Platform, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useMutation } from 'react-relay';
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
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import UploadProgressModal from '#ui/UploadProgressModal';
import type {
  NativeScreenProps,
  ScreenOptions,
} from '#components/NativeRouter';
import type { contactFormValues } from '#helpers/contactHelpers';
import type { ContactEditScreenMutation } from '#relayArtifacts/ContactEditScreenMutation.graphql';
import type { ContactEditRoute } from '#routes';
import type { CountryCode } from 'libphonenumber-js';
import type { ScrollView } from 'react-native';

const ContactEditScreen = ({
  route: { params },
}: NativeScreenProps<ContactEditRoute>) => {
  const scrollRef = useRef<ScrollView>(null);
  const styles = useStyleSheet(stylesheet);

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const intl = useIntl();
  const router = useRouter();

  const [commit, loading] = useMutation<ContactEditScreenMutation>(graphql`
    mutation ContactEditScreenMutation(
      $contactId: ID!
      $contact: ContactInput!
    ) {
      saveContact(contactId: $contactId, input: $contact) {
        ...contactHelpersReadContactData
      }
    }
  `);

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
        uri: params.contact.avatar?.uri || '',
      },
      firstName: params.contact.firstName,
      lastName: params.contact.lastName,
      title: params.contact.title,
      company: params.contact.company,
      logo: {
        uri: params.contact.logo?.uri || '',
      },
      phoneNumbers: params.contact.phoneNumbers?.map(({ label, number }) => {
        const { countryCode, number: parsedPhoneNumber } =
          extractPhoneNumberDetails(number);
        return {
          label:
            Platform.OS === 'android' && label === 'Fax' ? 'otherFax' : label,
          number: parsedPhoneNumber || number,
          countryCode,
        };
      }),
      emails: params.contact.emails?.map(({ address, label }) => ({
        address,
        label,
      })),
      urls: params.contact.urls ?? [],
      addresses: params.contact.addresses?.map(({ address, label }) => ({
        address,
        label,
      })),
      birthday: {
        birthday: params.contact.birthday,
      },
      socials: params.contact.socials ?? [],
      note: params.contact.note,
      meetingDate: params.contact.meetingDate
        ? new Date(params.contact.meetingDate)
        : new Date(),
    },
  });

  const submit = () => {
    Keyboard.dismiss();
    handleSubmit(async ({ avatar, logo, ...data }) => {
      if (!params.contact.id) {
        return;
      }

      const uploads = [];

      if (avatar?.local && avatar.uri) {
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

      commit({
        variables: {
          contactId: params.contact.id,
          contact: {
            avatarId,
            logoId,
            emails: data.emails?.length
              ? data.emails.filter(email => email.address)
              : [],
            phoneNumbers: data.phoneNumbers?.length
              ? data.phoneNumbers
                  .filter(phoneNumber => phoneNumber.number)
                  .map(({ countryCode, ...phoneNumber }) => {
                    const number = getPhonenumberWithCountryCode(
                      phoneNumber.number,
                      countryCode as CountryCode,
                    );
                    return { label: phoneNumber.label, number };
                  })
              : [],
            urls: data.urls,
            addresses: data.addresses,
            socials: data.socials,
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

export default ContactEditScreen;
