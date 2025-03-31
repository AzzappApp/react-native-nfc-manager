import { zodResolver } from '@hookform/resolvers/zod';
import {
  drawAsImageFromPicture,
  createPicture,
  ImageFormat,
} from '@shopify/react-native-skia';
import { ResizeMode, Video } from 'expo-av';
import { Paths, File } from 'expo-file-system/next';
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import { capitalize } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useColorScheme, View, StyleSheet } from 'react-native';
import { getLocales } from 'react-native-localize';
import * as mime from 'react-native-mime-types'; // FIXME import is verry big
import Toast from 'react-native-toast-message';
import { useMutation, usePreloadedQuery } from 'react-relay';
import { graphql, Observable } from 'relay-runtime';
import ERRORS from '@azzapp/shared/errors';
import { combineMultiUploadProgresses } from '@azzapp/shared/networkHelpers';
import { PAYMENT_IS_ENABLED } from '#Config';
import { colors } from '#theme';
import ContactCardDetector from '#components/ContactCardScanner/ContactCardDetector';
import coverDrawer from '#components/CoverEditor/coverDrawer';
import { COVER_EXPORT_VIDEO_RESOLUTION } from '#components/CoverEditor/coverEditorHelpers';
import {
  preventModalDismiss,
  useRouter,
  ScreenModal,
} from '#components/NativeRouter';
import BottomSheetPopup from '#components/popup/BottomSheetPopup';
import { onChangeWebCard } from '#helpers/authStore';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { createRandomFileName, getFileName } from '#helpers/fileHelpers';
import { keyboardDismiss } from '#helpers/keyboardHelper';
import { NativeTextureLoader } from '#helpers/mediaEditions';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import {
  extractPhoneNumberDetails,
  getPhonenumberWithCountryCode,
} from '#helpers/phoneNumbersHelper';
import relayScreen from '#helpers/relayScreen';
import useBoolean from '#hooks/useBoolean';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import UploadProgressModal from '#ui/UploadProgressModal';
import ContactCardCreateForm from './ContactCardCreateForm';
import {
  contactCardSchema,
  type ContactCardFormValues,
} from './ContactCardSchema';
import type { CoverEditorState } from '#components/CoverEditor';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactCardCreateScreenMutation } from '#relayArtifacts/ContactCardCreateScreenMutation.graphql';
import type { ContactCardCreateScreenQuery } from '#relayArtifacts/ContactCardCreateScreenQuery.graphql';
import type { ContactCardDetectorMutation$data } from '#relayArtifacts/ContactCardDetectorMutation.graphql';
import type { ContactCardCreateRoute } from '#routes';
import type { ViewStyle } from 'react-native';

const contactCardCreateScreenQuery = graphql`
  query ContactCardCreateScreenQuery {
    currentUser {
      ...ContactCardCreateForm_user
      userContactData {
        firstName
        lastName
        email
        phoneNumber
        companyName
        avatarUrl
      }
    }
  }
`;

const ContactCardCreateScreen = ({
  preloadedQuery,
}: RelayScreenProps<ContactCardCreateRoute, ContactCardCreateScreenQuery>) => {
  const { currentUser } = usePreloadedQuery(
    contactCardCreateScreenQuery,
    preloadedQuery,
  );

  const [commit, loading] = useMutation<ContactCardCreateScreenMutation>(
    graphql`
      mutation ContactCardCreateScreenMutation(
        $webCardKind: String!
        $contactCard: ContactCardInput!
        $primaryColor: String
        $coverMediaId: String
        $publishWebCard: Boolean!
      ) {
        createContactCard(
          webCardKind: $webCardKind
          contactCard: $contactCard
          primaryColor: $primaryColor
          coverMediaId: $coverMediaId
          publishWebCard: $publishWebCard
        ) {
          profile {
            id
            contactCardUrl
            profileRole
            invited
            webCard {
              id
              userName
              hasCover
              cardIsPublished
              coverBackgroundColor
              coverIsPredefined
              coverMedia {
                id
              }
              cardColors {
                dark
                primary
              }
            }
          }
        }
      }
    `,
  );

  const intl = useIntl();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);
  const [popupVisible, showPopup, hidePopup] = useBoolean(false);

  const styles = useStyleSheet(stylesheet);
  const parsedPhoneNumber = currentUser?.userContactData?.phoneNumber
    ? parsePhoneNumberFromString(currentUser?.userContactData?.phoneNumber)
    : null;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
  } = useForm<ContactCardFormValues>({
    mode: 'onBlur',
    shouldFocusError: true,
    resolver: zodResolver(contactCardSchema),
    defaultValues: {
      webCardKind: 'personal',
      primaryColor: colors.grey400,
      firstName: currentUser?.userContactData?.firstName,
      lastName: currentUser?.userContactData?.lastName,
      company: currentUser?.userContactData?.companyName,
      emails: currentUser?.userContactData?.email
        ? [
            {
              label: 'Work',
              address: currentUser?.userContactData?.email,
              selected: true,
            },
          ]
        : [],
      phoneNumbers: currentUser?.userContactData?.phoneNumber
        ? [
            {
              label: 'Work',
              number:
                parsedPhoneNumber?.nationalNumber ||
                currentUser?.userContactData?.phoneNumber,
              selected: true,
              countryCode:
                parsedPhoneNumber?.country || getLocales()[0].countryCode,
            },
          ]
        : [],
      avatar: currentUser?.userContactData?.avatarUrl
        ? {
            uri: currentUser?.userContactData?.avatarUrl,
            local: false,
          }
        : null,
    },
  });

  const submit = handleSubmit(
    async ({ avatar, webCardKind, company, firstName, logo, ...data }) => {
      if (webCardKind === 'business' && (!company || company.length === 0)) {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'You shall provide a company name for business webcard',
            description:
              'Error toast message when creating a business webcard without company name',
          }),
          autoHide: false,
          props: {
            showClose: true,
          },
          position: 'top',
        });
        return;
      } else if (
        webCardKind === 'personal' &&
        (!firstName || firstName.length === 0)
      ) {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'You shall provide a firstname for personal webcard',
            description:
              'Error toast message when creating a personal webcard without firstname',
          }),
          autoHide: false,
          props: {
            showClose: true,
          },
          position: 'top',
        });
        return;
      }
      const uploads = [];

      if (avatar?.local && avatar.uri) {
        setProgressIndicator(Observable.from(0));

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

      logo = webCardKind === 'business' ? logo : null;

      if (logo?.uri) {
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

      const logoWidth = logo?.width ?? 0;
      const logoHeight = logo?.height ?? 0;
      //create the coverId
      if (logo && logo.id != null && logoWidth > 0 && logoHeight > 0) {
        const logoTextureInfo = NativeTextureLoader.loadImage(logo.uri, {
          width: logoWidth,
          height: logoHeight,
        });
        NativeTextureLoader.ref(logoTextureInfo.key);
        const textTure = await logoTextureInfo.promise;

        const image = drawAsImageFromPicture(
          createPicture(canvas => {
            coverDrawer({
              canvas,
              ...COVER_EXPORT_VIDEO_RESOLUTION,
              frames: {},
              currentTime: 0,
              videoScales: {},
              coverEditorState: {
                ...DEFAULT_COVER_DATA,
                backgroundColor: data.expendableColor ?? colors.white,
                overlayLayers: [
                  {
                    animation: null,
                    borderColor: '#0E1216',
                    borderRadius: 0,
                    borderWidth: 0,
                    bounds: {
                      height:
                        ((LOGO_PERCENT_WIDTH *
                          COVER_EXPORT_VIDEO_RESOLUTION.width) /
                          (logoWidth / logoHeight) /
                          COVER_EXPORT_VIDEO_RESOLUTION.height) *
                        100,
                      width: 70, //we take 70%  for the width
                      x: 50,
                      y: 50,
                    },
                    editionParameters: null,
                    elevation: 0,
                    endPercentageTotal: 100,
                    filter: null,
                    height: logoHeight,
                    id: logo.id!, //even the != null condition above, the linter does not understand
                    kind: 'image',
                    rotation: 0,
                    shadow: false,
                    startPercentageTotal: 0,
                    uri: logo.uri,
                    width: logoWidth,
                  },
                ],
                cardColors: {
                  primary: data.primaryColor ?? colors.grey400,
                  light: '#FFFFFF',
                  dark: '#0E1216',
                  otherColors: [],
                },
              },
              images: {
                [logo.id!]: textTure,
              },
              lutTextures: {},
              videoComposition: { duration: 0, items: [] },
            });
          }),
          COVER_EXPORT_VIDEO_RESOLUTION,
        );

        const blob = await image.encodeToBytes(ImageFormat.JPEG, 95);
        const outPath = Paths.cache.uri + createRandomFileName('jpg');

        const file = new File(outPath);
        file.create();
        file.write(blob);
        NativeTextureLoader.unref(logoTextureInfo.key);
        const { uploadURL, uploadParameters } = await uploadSign({
          kind: 'image',
          target: 'cover',
        });

        const fileUpload: any = {
          name: getFileName(outPath),
          uri: outPath,
          type: 'image/jpeg',
        };

        uploads.push(uploadMedia(fileUpload, uploadURL, uploadParameters));
      } else {
        uploads.push(null);
      }

      const uploadsToDo = uploads.filter(val => val !== null);
      if (uploadsToDo.length) {
        setProgressIndicator(
          combineMultiUploadProgresses(
            uploadsToDo.map(upload => upload.progress),
          ),
        );
      }

      const [uploadedAvatarId, uploadedLogoId, uploadedCoverId] =
        await Promise.all(
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
      if (logo?.local) {
        addLocalCachedMediaFile(logoId, 'image', logo.uri);
      }

      commit({
        variables: {
          primaryColor: data.primaryColor ?? colors.grey400,
          webCardKind: webCardKind as string,
          coverMediaId: uploadedCoverId,
          publishWebCard: true,
          contactCard: {
            emails: data.emails?.length
              ? data.emails.filter(email => email.address)
              : undefined,
            phoneNumbers: data.phoneNumbers?.length
              ? data.phoneNumbers
                  .filter(phoneNumber => phoneNumber.number)
                  .map(({ countryCode, ...phoneNumber }) => {
                    const number = getPhonenumberWithCountryCode(
                      phoneNumber.number,
                      countryCode as CountryCode,
                    );
                    return { ...phoneNumber, number };
                  })
              : undefined,
            urls:
              webCardKind === 'business'
                ? data.urls.filter(({ address }) => address)
                : undefined,
            addresses: data.addresses
              ? data.addresses.filter(address => address.address)
              : undefined,
            birthday: data.birthday,
            socials: data.socials
              ? data.socials.filter(social => social.url)
              : undefined,
            avatarId,
            logoId: webCardKind === 'business' ? logoId : undefined,
            company: webCardKind === 'business' ? company : undefined,
            firstName,
            lastName: data.lastName,
            title: data.title,
            companyActivityLabel:
              webCardKind === 'business'
                ? data.companyActivityLabel
                : undefined,
          },
        },
        onCompleted: data => {
          setProgressIndicator(null);
          const { profile } = data.createContactCard;
          if (!profile?.webCard) {
            throw new Error('WebCard not created');
          }
          onChangeWebCard({
            profileId: profile.id,
            profileRole: profile.profileRole,
            invited: profile.invited,
            webCardId: profile.webCard.id,
            webCardUserName: profile.webCard.userName,
            cardIsPublished: profile.webCard.cardIsPublished,
            coverIsPredefined: profile.webCard.coverIsPredefined,
          });
          if (
            !(router.getCurrentRoute() as ContactCardCreateRoute)?.params
              ?.launchedFromWelcomeScreen
          ) {
            // if we redirect too soon, the home background is not displayed
            router.back();
          }
        },
        updater: store => {
          const root = store.getRoot();
          const user = root.getLinkedRecord('currentUser');
          const profiles = user?.getLinkedRecords('profiles');

          const newProfile = store
            .getRootField('createContactCard')
            ?.getLinkedRecord('profile');
          if (!newProfile) {
            return;
          }
          // webCard are sorted by username so logically no username -> first
          profiles?.unshift(newProfile);

          user?.setLinkedRecords(profiles, 'profiles');
          root.setLinkedRecord(user, 'currentUser');
        },
        onError: e => {
          setProgressIndicator(null);
          console.error(e);

          if (e.message === ERRORS.SUBSCRIPTION_REQUIRED) {
            if (PAYMENT_IS_ENABLED) {
              router.push({ route: 'USER_PAY_WALL' });
            } else {
              Toast.show({
                position: 'top',
                type: 'error',
                text1: intl.formatMessage({
                  defaultMessage:
                    'You have reached the limit of contact cards or you can’t create such type of contact cards.',
                  description:
                    'Error toast message when reaching the limit of contact cards on android',
                }),
              });
            }

            return;
          }

          Toast.show({
            type: 'error',
            text1: intl.formatMessage(
              {
                defaultMessage:
                  'Error, could not save your contact card{azzappA}. Please try again.',
                description:
                  'Error toast message when saving contact card failed',
              },
              {
                azzappA: <Text variant="azzapp">a</Text>,
              },
            ) as unknown as string,
          });
          router.back();
        },
      });
    },
  );

  const loadFormFromScan = useCallback(
    (data: ContactCardDetectorMutation$data['extractVisitCardData']) => {
      setValue('company', data?.company);
      setValue('firstName', data?.firstName);
      setValue('lastName', data?.lastName);
      if (data?.title) {
        setValue('title', capitalize(data?.title));
      } else {
        setValue('title', undefined);
      }
      setValue('companyActivityLabel', data?.company);
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
          return { address: url, selected: true };
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

  useEffect(() => {
    return Toast.hide;
  }, []);

  useEffect(() => {
    const popupTimeout = setTimeout(() => {
      // need to wait for the screen to be displayed
      showPopup();
    }, 300);
    return () => clearTimeout(popupTimeout);
  }, [showPopup]);

  const [showScanner, openScanner, closeScanner] = useBoolean(false);

  const openScannerFromPopup = useCallback(() => {
    hidePopup();
    keyboardDismiss();
    openScanner();
  }, [hidePopup, openScanner]);

  const { top } = useScreenInsets();

  return (
    <>
      <Container style={[styles.container, { paddingTop: top }]}>
        <Header
          middleElement={intl.formatMessage(
            {
              defaultMessage: 'Create Contact Card{azzappA}',
              description: 'Create Contact Card Modal title',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          )}
          leftElement={
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Cancel',
                description: 'Create contact card modal cancel button title',
              })}
              onPress={router.back}
              variant="secondary"
              style={styles.headerButton}
            />
          }
          rightElement={
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Save',
                description: 'Create contact card modal save button label',
              })}
              testID="save-contact-card"
              loading={isSubmitting || loading}
              onPress={submit}
              variant="primary"
              style={styles.headerButton}
            />
          }
        />
        <Text variant="small" style={styles.centerGreyText}>
          <FormattedMessage
            defaultMessage="Add the information you’d like to share with your ContactCard"
            description="ContactCardCreateScreen - Header Subtitle"
          />
        </Text>
        <ScanMyPaperBusinessCard
          onPress={openScannerFromPopup}
          style={styles.scanBusinessCardButton}
        />

        <ContactCardCreateForm control={control} user={currentUser} />
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
      <BottomSheetPopup visible={popupVisible} isAnimatedContent>
        <View style={styles.popupContainer}>
          <View style={styles.popupPage}>
            <Video
              style={styles.popupIllustration}
              isLooping
              isMuted
              shouldPlay
              resizeMode={ResizeMode.COVER}
              source={
                colorScheme === 'dark'
                  ? require('#assets/hint_0_dark_ae.mp4')
                  : require('#assets/hint_0_light_ae.mp4')
              }
            />
            <Text variant="large" style={styles.popupHeaderTextContainer}>
              <FormattedMessage
                defaultMessage="Fill your ContactCard"
                description="Popup Card creation / main message / Fill your ContactCard"
              />
            </Text>
            <Text variant="medium" style={styles.popupDescriptionTextContainer}>
              <FormattedMessage
                defaultMessage="Your ContactCard contains all the informations you want to share when someone scans your QR Code, like phone number, email adress, ..."
                description="Popup Card creation / main message / secondary message description / explanation scan QRCode"
              />
            </Text>
          </View>
          <Button
            onPress={hidePopup}
            label={intl.formatMessage({
              defaultMessage: 'Fill my ContactCard manually',
              description:
                'Create contact card screen - Popup -  button creation manually',
            })}
          />
          <Text variant="small" style={styles.centerGreyText}>
            <FormattedMessage
              defaultMessage=" or save time"
              description="ContactCardCreateScreen - Message in popup between 2 buttons"
            />
          </Text>
          <ScanMyPaperBusinessCard onPress={openScannerFromPopup} />
        </View>
      </BottomSheetPopup>
      {showScanner && (
        <View style={StyleSheet.absoluteFill}>
          <ContactCardDetector
            close={closeScanner}
            extractData={loadFormFromScan}
            createContactCard
          />
        </View>
      )}
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
  centerGreyText: {
    color: appearance === 'dark' ? colors.grey400 : colors.grey600,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  scanBusinessCardButton: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
}));

const ContactCardCreateRelayScreen = relayScreen(ContactCardCreateScreen, {
  query: contactCardCreateScreenQuery,
});

ContactCardCreateRelayScreen.getScreenOptions = (): ScreenOptions => ({
  stackAnimation: 'slide_from_bottom',
});

export default relayScreen(ContactCardCreateScreen, {
  query: contactCardCreateScreenQuery,
  profileBound: false,
});

export const ScanMyPaperBusinessCard = ({
  onPress,
  style,
}: {
  onPress: () => void;
  style?: ViewStyle;
}) => {
  const intl = useIntl();
  return (
    <Button
      variant="secondary"
      label={intl.formatMessage({
        defaultMessage: 'Scan a Card, Badge, email signature...',
        description:
          'MultiUserAddModal - Scan a Card, Badge, email signature buttonlabel',
      })}
      onPress={onPress}
      leftElement={<Icon icon="scan" size={24} />}
      style={style}
      textStyle={{ flex: 1, textAlign: 'center' }}
    />
  );
};

const DEFAULT_COVER_DATA: CoverEditorState = {
  isModified: true,
  lottie: null,
  medias: [],
  coverTransition: null,
  overlayLayers: [],
  textLayers: [],
  linksLayer: {
    links: [],
    color: colors.black,
    size: 24,
    position: {
      x: 50,
      y: 50,
    },
    rotation: 0,
    shadow: false,
  },
  editionMode: 'text',
  selectedItemIndex: null,
  loadingRemoteMedia: false,
  loadingLocalMedia: false,
  loadingError: undefined,
  shouldComputeCoverPreviewPositionPercentage: false,
  images: {},
  imagesScales: {},
  localFilenames: {},
  lutTextures: {},
  backgroundColor: null,
  cardColors: {
    primary: colors.grey400,
    light: colors.white,
    dark: colors.black,
    otherColors: [],
  },
};
const LOGO_PERCENT_WIDTH = 70 / 100;
