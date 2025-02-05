import { zodResolver } from '@hookform/resolvers/zod';
import { ResizeMode, Video } from 'expo-av';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useColorScheme, View } from 'react-native';
import * as mime from 'react-native-mime-types'; // FIXME import is verry big
import Toast from 'react-native-toast-message';
import { useMutation } from 'react-relay';
import { graphql, Observable } from 'relay-runtime';
import { mainRoutes } from '#mobileRoutes';
import { colors } from '#theme';
import {
  preventModalDismiss,
  useRouter,
  ScreenModal,
} from '#components/NativeRouter';
import BottomSheetPopup from '#components/popup/BottomSheetPopup';
import { PopupButton } from '#components/popup/PopupElements';
import { onChangeWebCard } from '#helpers/authStore';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import { getPhonenumberWithCountryCode } from '#helpers/phoneNumbersHelper';
import useBoolean from '#hooks/useBoolean';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';
import UploadProgressModal from '#ui/UploadProgressModal';
import ContactCardCreateForm from './ContactCardCreateForm';
import {
  contactCardSchema,
  type ContactCardFormValues,
} from './ContactCardSchema';
import type { ScreenOptions } from '#components/NativeRouter';
import type { ContactCardCreateScreenMutation } from '#relayArtifacts/ContactCardCreateScreenMutation.graphql';
import type { ContactCardCreateRoute } from '#routes';
import type { CountryCode } from 'libphonenumber-js';

const ContactCardCreateScreen = () => {
  const styles = useStyleSheet(stylesheet);

  const [commit, loading] = useMutation<ContactCardCreateScreenMutation>(
    graphql`
      mutation ContactCardCreateScreenMutation(
        $webCardKind: String!
        $contactCard: ContactCardInput!
      ) {
        createContactCard(
          webCardKind: $webCardKind
          contactCard: $contactCard
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

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ContactCardFormValues>({
    mode: 'onBlur',
    shouldFocusError: true,
    resolver: zodResolver(contactCardSchema),
    defaultValues: {
      webCardKind: 'personal',
    },
  });

  const submit = handleSubmit(
    async ({ avatar, webCardKind, company, firstName, ...data }) => {
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
      let upload;

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
        upload = uploadMedia(file, uploadURL, uploadParameters);
        setProgressIndicator(
          upload.progress.map(({ loaded, total }) => loaded / total),
        );
      }

      const uploadedAvatarId = await upload?.promise.then(({ public_id }) => {
        return public_id;
      });

      const avatarId =
        avatar === null ? null : avatar?.local ? uploadedAvatarId : avatar?.id;

      const urls = data.companyUrl
        ? [{ address: data.companyUrl, selected: true }, ...data.urls]
        : data.urls;

      commit({
        variables: {
          webCardKind: webCardKind as string,
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
            urls: urls?.length ? urls : undefined,
            addresses: data.addresses
              ? data.addresses.filter(address => address.address)
              : undefined,
            birthday: data.birthday,
            socials: data.socials
              ? data.socials.filter(social => social.url)
              : undefined,
            avatarId,
            company,
            firstName,
            lastName: data.lastName,
            title: data.title,
            companyActivityLabel: data.companyActivityLabel,
          },
        },
        onCompleted: data => {
          if (avatarId && avatar?.uri) {
            addLocalCachedMediaFile(
              `${'image'.slice(0, 1)}:${avatarId}`,
              'image',
              avatar.uri,
            );
          }
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
            (router.getCurrentRoute() as ContactCardCreateRoute)?.params
              ?.launchedFromWelcomeScreen
          ) {
            router.replaceAll(mainRoutes(false));
          } else {
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
          console.error(e);
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

  return (
    <>
      <Container style={styles.container}>
        <SafeAreaView style={styles.container}>
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

          <ContactCardCreateForm control={control} />
          <ScreenModal
            visible={!!progressIndicator}
            gestureEnabled={false}
            onRequestDismiss={preventModalDismiss}
          >
            {progressIndicator && (
              <UploadProgressModal progressIndicator={progressIndicator} />
            )}
          </ScreenModal>
        </SafeAreaView>
      </Container>
      <BottomSheetPopup
        visible={popupVisible}
        onDismiss={hidePopup}
        isAnimatedContent
      >
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
          <PopupButton
            onPress={hidePopup}
            text={intl.formatMessage({
              defaultMessage: 'Ok, continue',
              description: 'Creare contact card screen / next buton on popup',
            })}
          />
        </View>
      </BottomSheetPopup>
    </>
  );
};

const stylesheet = createStyleSheet(theme => ({
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  container: { flex: 1 },
  popupContainer: {
    backgroundColor: theme === 'dark' ? colors.grey900 : colors.white,
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
    color: theme === 'dark' ? colors.white : colors.black,
    paddingTop: 20,
    textAlign: 'center',
  },
  popupDescriptionTextContainer: {
    color: theme === 'dark' ? colors.white : colors.black,
    paddingTop: 10,
    textAlign: 'center',
  },
}));

ContactCardCreateScreen.getScreenOptions = (): ScreenOptions => ({
  stackAnimation: 'slide_from_bottom',
});

export default ContactCardCreateScreen;
