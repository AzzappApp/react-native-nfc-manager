import { zodResolver } from '@hookform/resolvers/zod';
import { capitalize } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import * as mime from 'react-native-mime-types'; // FIXME import is verry big
import Toast from 'react-native-toast-message';
import { useMutation } from 'react-relay';
import { graphql, Observable } from 'relay-runtime';
import { combineMultiUploadProgresses } from '@azzapp/shared/networkHelpers';
import { colors } from '#theme';
import ContactCardDetector from '#components/ContactCardScanner/ContactCardDetector';
import {
  preventModalDismiss,
  ScreenModal,
  useRouter,
} from '#components/NativeRouter';
import { getAuthState } from '#helpers/authStore';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getFileName } from '#helpers/fileHelpers';
import { keyboardDismiss } from '#helpers/keyboardHelper';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import {
  extractPhoneNumberDetails,
  getPhonenumberWithCountryCode,
} from '#helpers/phoneNumbersHelper';
import useBoolean from '#hooks/useBoolean';
import useScreenInsets from '#hooks/useScreenInsets';
import { ScanMyPaperBusinessCard } from '#screens/ContactCardEditScreen/ContactCardCreateScreen';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import UploadProgressModal from '#ui/UploadProgressModal';
import ContactCreateForm from './ContactCreateForm';
import { contactSchema, type ContactFormValues } from './ContactSchema';
import type {
  NativeScreenProps,
  ScreenOptions,
} from '#components/NativeRouter';
import type { ContactCardDetectorMutation$data } from '#relayArtifacts/ContactCardDetectorMutation.graphql';
import type { ContactCreateScreenMutation } from '#relayArtifacts/ContactCreateScreenMutation.graphql';
import type { ContactCreateRoute } from '#routes';
import type { CountryCode } from 'libphonenumber-js';

const ContactCreateScreen = ({
  route: { params },
}: NativeScreenProps<ContactCreateRoute>) => {
  const styles = useStyleSheet(stylesheet);

  const [notifyError, setNotifyError] = useState(false);
  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const [commit, loading] = useMutation<ContactCreateScreenMutation>(graphql`
    mutation ContactCreateScreenMutation(
      $profileId: ID!
      $contact: AddContactInput!
      $notify: Boolean!
      $scanUsed: Boolean!
    ) {
      addContact(
        profileId: $profileId
        input: $contact
        notify: $notify
        scanUsed: $scanUsed
      ) {
        contact {
          id
        }
      }
    }
  `);

  const intl = useIntl();
  const router = useRouter();
  const profileId = getAuthState().profileInfos?.profileId;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid, isDirty },
    setValue,
  } = useForm<ContactFormValues>({
    mode: 'onBlur',
    shouldFocusError: true,
    resolver: zodResolver(contactSchema),
    defaultValues: {
      notify: true,
    },
  });

  const submit = () => {
    setNotifyError(false);
    handleSubmit(async ({ avatar, logo, ...data }) => {
      if (!profileId) {
        return;
      }
      if (data.notify && data.emails.length <= 0) {
        setNotifyError(true);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Error, could not save your contact. Please add email or uncheck the box.',
            description:
              'Error toast message when saving contact card without email and box checked',
          }),
        });

        return;
      }

      const uploads = [];

      if (avatar?.local && avatar.uri) {
        const fileName = getFileName(avatar.uri);
        const file: any = {
          name: fileName,
          uri: avatar.uri,
          type: mime.lookup(fileName) || 'image/jpeg',
        };

        const { uploadURL, uploadParameters } = await uploadSign({
          kind: 'image',
          target: 'avatar',
        });
        uploads.push(uploadMedia(file, uploadURL, uploadParameters));
      } else {
        uploads.push(null);
      }

      if (logo?.local && logo.uri) {
        const fileName = getFileName(logo.uri);
        const file: any = {
          name: fileName,
          uri: logo.uri,
          type: mime.lookup(fileName) || 'image/jpeg',
        };

        const { uploadURL, uploadParameters } = await uploadSign({
          kind: 'image',
          target: 'logo',
        });
        uploads.push(uploadMedia(file, uploadURL, uploadParameters));
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

      commit({
        variables: {
          profileId,
          scanUsed: data.scanUsed,
          notify: data.notify,
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
            firstname: data.firstName || '',
            lastname: data.lastName || '',
            title: data.title || '',
            birthday: data.birthday?.birthday || '',
            withShareBack: false,
          },
        },
        onCompleted: () => {
          if (avatarId && avatar?.uri) {
            addLocalCachedMediaFile(
              `${'image'.slice(0, 1)}:${avatarId}`,
              'image',
              avatar.uri,
            );
          }
          router.back();
        },
        updater: (store, response) => {
          if (response && response.addContact && profileId) {
            const profile = store.get(profileId);
            const nbContacts = profile?.getValue('nbContacts');

            if (typeof nbContacts === 'number') {
              profile?.setValue(nbContacts + 1, 'nbContacts');
            }
          }
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

  const [scanImage, setScanImage] = useState<{
    uri: string;
    aspectRatio: number;
  } | null>(null);
  const loadFormFromScan = useCallback(
    (
      data: ContactCardDetectorMutation$data['extractVisitCardData'],
      image: { uri: string; aspectRatio: number },
    ) => {
      setScanImage(image);
      setValue('firstName', data?.firstName);
      setValue('lastName', data?.lastName);
      setValue('scanUsed', true);
      if (data?.title) {
        setValue('title', capitalize(data?.title));
      } else {
        setValue('title', undefined);
      }
      setValue('company', data?.company);
      const formattedEmails = data?.emails
        ?.map((email: string) => {
          if (email) {
            return { address: email, selected: true, label: 'Work' };
          }
          return null;
        })
        .filter(n => n != null);
      if (formattedEmails) {
        setValue('emails', formattedEmails);
      } else {
        setValue('emails', []);
      }
      const formattedPhoneNumber = data?.phoneNumbers
        ?.map((phoneNumber: string) => {
          if (phoneNumber) {
            return {
              ...extractPhoneNumberDetails(phoneNumber),
              selected: true,
              label: 'Work',
            };
          }
          return null;
        })
        .filter(n => n != null);

      if (formattedPhoneNumber) {
        setValue('phoneNumbers', formattedPhoneNumber);
      } else {
        setValue('phoneNumbers', []);
      }

      const formattedUrl = data?.urls
        ?.map(url => {
          return { url };
        })
        .filter(n => n != null);

      if (formattedUrl) {
        setValue('urls', formattedUrl);
      } else {
        setValue('urls', []);
      }

      const formattedAdress = data?.addresses
        ?.map(add => {
          return { address: add, selected: true, label: 'Work' };
        })
        .filter(n => n != null);

      if (formattedAdress) {
        setValue('addresses', formattedAdress);
      } else {
        setValue('addresses', []);
      }
    },
    [setValue],
  );

  const [showScanner, openScanner, closeScanner] = useBoolean(
    params?.showCardScanner,
  );
  const closeScannerView = useCallback(() => {
    if (!isDirty) {
      router.back();
    }
    closeScanner();
  }, [closeScanner, isDirty, router]);

  const openScannerView = useCallback(() => {
    keyboardDismiss();
    openScanner();
  }, [openScanner]);

  const { top } = useScreenInsets();

  return (
    <>
      <Container style={[styles.container, { paddingTop: top }]}>
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Create Contact',
            description: 'Create Contact Card Modal title',
          })}
          leftElement={
            <IconButton
              icon="arrow_left"
              onPress={router.back}
              style={styles.leftArrowIcon}
            />
          }
          rightElement={
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Save',
                description: 'Create contact modal save button label',
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
        <ScanMyPaperBusinessCard
          onPress={openScannerView}
          style={styles.scanButton}
        />
        <ContactCreateForm
          control={control}
          scanImage={scanImage}
          notifyError={notifyError}
        />
        <ScreenModal
          visible={!!progressIndicator}
          gestureEnabled={false}
          onRequestDismiss={preventModalDismiss}
        >
          {progressIndicator && (
            <UploadProgressModal progressIndicator={progressIndicator} />
          )}
        </ScreenModal>

        {showScanner && (
          <View style={StyleSheet.absoluteFill}>
            <ContactCardDetector
              close={closeScanner}
              extractData={loadFormFromScan}
              closeContainer={closeScannerView}
            />
          </View>
        )}
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

ContactCreateScreen.getScreenOptions = (): ScreenOptions => ({
  stackAnimation: 'slide_from_bottom',
});

export default ContactCreateScreen;
