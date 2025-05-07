import { zodResolver } from '@hookform/resolvers/zod';
import { parse } from '@lepirlouit/vcard-parser';
import * as Sentry from '@sentry/react-native';
import { File } from 'expo-file-system/next';
import capitalize from 'lodash/capitalize';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { Keyboard, StyleSheet, View } from 'react-native';
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

import { emitContactAddedToProfile } from '#helpers/addContactHelper';
import { getAuthState } from '#helpers/authStore';
import { contactSchema, type contactFormValues } from '#helpers/contactHelpers';
import {
  getVCardAddresses,
  getVCardBirthday,
  getVCardCompany,
  getVCardEmail,
  getVCardFirstName,
  getVCardImage,
  getVCardLastName,
  getVCardPhoneNumber,
  getVCardSocialUrls,
  getVCardTitle,
  getVCardUrls,
} from '#helpers/contacts/textToVCard';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  prepareAvatarForUpload,
  prepareLogoForUpload,
} from '#helpers/imageHelpers';
import { keyboardDismiss } from '#helpers/keyboardHelper';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia } from '#helpers/MobileWebAPI';
import {
  extractPhoneNumberDetails,
  getPhonenumberWithCountryCode,
} from '#helpers/phoneNumbersHelper';
import useBoolean from '#hooks/useBoolean';
import { useCurrentLocation } from '#hooks/useLocation';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import { ScanMyPaperBusinessCard } from '#screens/ContactCardEditScreen/ContactCardCreateScreen';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import UploadProgressModal from '#ui/UploadProgressModal';
import ContactCreateForm from './ContactCreateForm';
import type {
  NativeScreenProps,
  ScreenOptions,
} from '#components/NativeRouter';
import type { ContactCardDetectorMutation$data } from '#relayArtifacts/ContactCardDetectorMutation.graphql';
import type { ContactCreateScreenMutation } from '#relayArtifacts/ContactCreateScreenMutation.graphql';
import type { ContactCreateRoute } from '#routes';
import type { vCard } from '@lepirlouit/vcard-parser';
import type { CountryCode } from 'libphonenumber-js';

const ContactCreateScreen = ({
  route: { params },
}: NativeScreenProps<ContactCreateRoute>) => {
  const styles = useStyleSheet(stylesheet);

  const [notifyError, setNotifyError] = useState(false);
  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const currentLocation = useCurrentLocation();
  const { location, address } = currentLocation?.value || {};

  const [commit, loading] = useMutation<ContactCreateScreenMutation>(graphql`
    mutation ContactCreateScreenMutation(
      $profileId: ID!
      $contact: ContactInput!
      $notify: Boolean!
      $scanUsed: Boolean!
    ) {
      createContact(
        profileId: $profileId
        input: $contact
        notify: $notify
        scanUsed: $scanUsed
        withShareBack: false
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
  const [notify, toggleNotify] = useToggle(true);
  const [scanUsed, setScan] = useBoolean(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid, isDirty },
    setValue,
  } = useForm<contactFormValues>({
    mode: 'onBlur',
    shouldFocusError: true,
    resolver: zodResolver(contactSchema),
    defaultValues: {
      meetingDate: new Date(),
    },
  });

  const submit = useCallback(() => {
    setNotifyError(false);
    Keyboard.dismiss();
    handleSubmit(async ({ avatar, logo, ...data }) => {
      if (!profileId) {
        return;
      }
      if (notify && data.emails.length <= 0) {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Error, could not save your contact. Please add email or uncheck the box.',
            description:
              'Error toast message when saving contact card without email and box checked',
          }),
          onHide: () => {
            setNotifyError(true);
          },
        });

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
          profileId,
          scanUsed,
          notify,
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
            note: data.note || '',
            location: location
              ? {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }
              : null,
            address: address
              ? {
                  country: address.country,
                  city: address.city,
                  subregion: address.subregion,
                  region: address.region,
                }
              : null,
            meetingDate: data.meetingDate
              ? new Date(data.meetingDate)
              : new Date(),
          },
        },
        onCompleted: () => {
          emitContactAddedToProfile();
          router.back();
        },
        updater: (store, response) => {
          if (response && response.createContact && profileId) {
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
  }, [
    address,
    commit,
    handleSubmit,
    intl,
    location,
    notify,
    profileId,
    router,
    scanUsed,
  ]);

  useEffect(() => {
    return Toast.hide;
  }, []);

  const [scanImage, setScanImage] = useState<{
    uri: string;
    aspectRatio: number;
  } | null>(null);

  const loadFormFromVCard = useCallback(
    (data: vCard) => {
      setValue('firstName', getVCardFirstName(data));
      setValue('lastName', getVCardLastName(data));
      if (data?.title) {
        setValue('title', capitalize(getVCardTitle(data)));
      } else {
        setValue('title', undefined);
      }
      setValue('company', getVCardCompany(data));

      const formattedEmails = getVCardEmail(data)
        ?.map(email => {
          if (email) {
            return { address: email.email, label: email.label };
          }
          return null;
        })
        .filter(n => n != null);
      if (formattedEmails) {
        setValue('emails', formattedEmails);
      } else {
        setValue('emails', []);
      }
      const formattedPhoneNumber = getVCardPhoneNumber(data)?.map(
        phoneNumber => {
          return {
            ...extractPhoneNumberDetails(phoneNumber.phone),
            selected: true,
            label: phoneNumber.label,
          };
        },
      );

      if (formattedPhoneNumber) {
        setValue('phoneNumbers', formattedPhoneNumber);
      } else {
        setValue('phoneNumbers', []);
      }

      const formattedUrl = getVCardUrls(data)
        ?.map(url => {
          return { url };
        })
        .filter(n => n != null);

      if (formattedUrl) {
        setValue('urls', formattedUrl);
      } else {
        setValue('urls', []);
      }

      const formattedAdress = getVCardAddresses(data)
        ?.map(add => {
          return { address: add.adr, label: add.label };
        })
        .filter(n => n != null);

      if (formattedAdress) {
        setValue('addresses', formattedAdress);
      } else {
        setValue('addresses', []);
      }

      const formatedBirthday = getVCardBirthday(data);
      if (formatedBirthday) {
        setValue('birthday', { birthday: formatedBirthday });
      } else {
        setValue('birthday', null);
      }
      const formattedSocialProfile = getVCardSocialUrls(data)
        ?.map(profile => {
          return { url: profile.url, label: profile.label };
        })
        .filter(n => n != null);

      if (formattedSocialProfile) {
        setValue('socials', formattedSocialProfile);
      } else {
        setValue('socials', []);
      }
      const photo = getVCardImage(data);
      if (photo) {
        setValue('avatar', {
          id: photo,
          local: true,
          uri: photo,
        });
      }
    },
    [setValue],
  );

  useEffect(() => {
    // Load data from vCard uri
    if (params?.vCardUri) {
      const file = new File(params?.vCardUri);
      if (file.exists) {
        const VCard = parse(file.text());
        if (VCard) {
          loadFormFromVCard?.(VCard);
        }
      }
    }
  }, [loadFormFromVCard, params?.vCardUri]);

  const loadFormFromScan = useCallback(
    (
      data: ContactCardDetectorMutation$data['extractVisitCardData'],
      image: { uri: string; aspectRatio: number },
    ) => {
      setScanImage(image);
      setValue('firstName', data?.firstName);
      setValue('lastName', data?.lastName);
      setScan();
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
    [setScan, setValue],
  );

  const [showScanner, openScanner, closeScanner] = useBoolean(
    params?.showCardScanner,
  );
  const closeScannerView = useCallback(() => {
    if (!isDirty) {
      router.back();
    } else {
      closeScanner();
    }
  }, [closeScanner, isDirty, router]);

  const openScannerView = useCallback(() => {
    keyboardDismiss();
    openScanner();
  }, [openScanner]);

  const { top } = useScreenInsets();

  return (
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
        notify={notify}
        toggleNotify={toggleNotify}
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
            extractVCardData={loadFormFromVCard}
            closeContainer={closeScannerView}
          />
        </View>
      )}
    </Container>
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
