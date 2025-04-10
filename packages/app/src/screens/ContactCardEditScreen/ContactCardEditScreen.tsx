import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  graphql,
  useFragment,
  useMutation,
  usePreloadedQuery,
} from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { combineMultiUploadProgresses } from '@azzapp/shared/networkHelpers';
import { PAYMENT_IS_ENABLED } from '#Config';
import {
  preventModalDismiss,
  useRouter,
  ScreenModal,
} from '#components/NativeRouter';
import {
  prepareAvatarForUpload,
  prepareLogoForUpload,
} from '#helpers/imageHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia } from '#helpers/MobileWebAPI';
import {
  getPhonenumberWithCountryCode,
  parseContactCardPhoneNumber,
} from '#helpers/phoneNumbersHelper';
import relayScreen from '#helpers/relayScreen';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import { get as QRCodeWidth } from '#relayProviders/qrCodeWidth.relayprovider';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';
import UploadProgressModal from '#ui/UploadProgressModal';
import { contactCardFormFragment } from '../../fragments/ContactCardEditFormFragment';
import ContactCardEditForm from './ContactCardEditForm';
import { contactCardSchema } from './ContactCardSchema';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactCardEditFormFragment_profile$key } from '#relayArtifacts/ContactCardEditFormFragment_profile.graphql';
import type { ContactCardEditScreenQuery } from '#relayArtifacts/ContactCardEditScreenQuery.graphql';
import type { ContactCardEditRoute } from '#routes';
import type { ContactCardFormValues } from './ContactCardSchema';
import type { CountryCode } from 'libphonenumber-js';
import type { Observable } from 'relay-runtime';

const contactCardEditScreenQuery = graphql`
  query ContactCardEditScreenQuery($profileId: ID!, $pixelRatio: Float!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        ...ContactCardEditFormFragment_profile
          @arguments(pixelRatio: $pixelRatio)
      }
    }
  }
`;

const ContactCardEditScreen = ({
  preloadedQuery,
}: RelayScreenProps<ContactCardEditRoute, ContactCardEditScreenQuery>) => {
  const { node } = usePreloadedQuery(
    contactCardEditScreenQuery,
    preloadedQuery,
  );

  const profile = node?.profile;

  const {
    contactCard,
    avatar,
    logo,
    webCard,
    id: profileId,
  } = useFragment(
    contactCardFormFragment,
    profile as ContactCardEditFormFragment_profile$key,
  );

  const [commit, loading] = useMutation(graphql`
    mutation ContactCardEditScreenMutation(
      $profileId: ID!
      $contactCard: ContactCardInput!
      $pixelRatio: Float!
      $width: Int!
    ) {
      saveContactCard(profileId: $profileId, contactCard: $contactCard) {
        profile {
          ...ContactCardEditFormFragment_profile
            @arguments(pixelRatio: $pixelRatio)
          contactCardUrl
          contactCardQrCode(width: $width)
          lastContactCardUpdate
          createdAt
        }
      }
    }
  `);

  const intl = useIntl();

  const defaultValues = useMemo(() => {
    return {
      ...contactCard,
      company: contactCard?.company ?? '',
      emails: contactCard?.emails?.map(m => ({ ...m })) ?? [],
      phoneNumbers:
        contactCard?.phoneNumbers?.map(parseContactCardPhoneNumber) ?? [],
      urls: contactCard?.urls?.map(p => ({ ...p })) ?? [],
      addresses: contactCard?.addresses?.map(p => ({ ...p })) ?? [],
      birthday: contactCard?.birthday,
      socials: contactCard?.socials?.map(p => ({ ...p })) ?? [],
      avatar,
      logo: webCard?.isMultiUser ? webCard?.logo || logo : logo,
    };
  }, [avatar, contactCard, logo, webCard?.isMultiUser, webCard?.logo]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<ContactCardFormValues>({
    mode: 'onBlur',
    shouldFocusError: true,
    resolver: zodResolver(contactCardSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const router = useRouter();

  const submit = handleSubmit(async ({ avatar, logo, ...data }) => {
    const uploads = [];

    if (avatar?.local && avatar.uri) {
      const { file, uploadURL, uploadParameters } =
        await prepareAvatarForUpload(avatar.uri);
      uploads.push(uploadMedia(file, uploadURL, uploadParameters));
    } else {
      uploads.push(null);
    }

    if (logo?.local && logo.uri) {
      const { file, uploadURL, uploadParameters } = await prepareLogoForUpload(
        logo.uri,
      );
      uploads.push(uploadMedia(file, uploadURL, uploadParameters));
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
    if (logo?.local) {
      addLocalCachedMediaFile(logoId, 'image', logo.uri);
    }

    commit({
      variables: {
        profileId,
        contactCard: {
          ...data,
          emails: data.emails?.filter(email => email.address),
          phoneNumbers: data.phoneNumbers
            ?.filter(phoneNumber => phoneNumber.number)
            .map(({ countryCode, ...phoneNumber }) => {
              const number = getPhonenumberWithCountryCode(
                phoneNumber.number,
                countryCode as CountryCode,
              );
              return { ...phoneNumber, number };
            }),
          urls: data.urls?.filter(url => url.address),
          addresses: data.addresses?.filter(address => address.address),
          birthday: data.birthday,
          socials: data.socials?.filter(social => social.url),
          avatarId,
          logoId: !webCard?.isMultiUser || !webCard?.logo ? logoId : undefined,
        },
        pixelRatio: CappedPixelRatio(),
        width: QRCodeWidth(),
      },
      onCompleted: () => {
        setProgressIndicator(null);
        router.back();
      },
      updater: store => {
        if (profileId) {
          const user = store.getRoot().getLinkedRecord('currentUser');
          const profiles = user?.getLinkedRecords('profiles');

          if (profiles) {
            const profile = profiles?.find(
              profile => profile.getDataID() === profileId,
            );

            if (profile) {
              profile.setValue(
                new Date().toISOString(),
                'lastContactCardUpdate',
              );
            }
          }
        }
      },
      onError: e => {
        setProgressIndicator(null);
        console.error(e);
        if (e.message === ERRORS.SUBSCRIPTION_REQUIRED) {
          if (PAYMENT_IS_ENABLED) {
            router.push({ route: 'USER_PAY_WALL' });
          } else {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage: 'You can’t create such type of contact cards.',
                description:
                  'Error toast message when user tries to create a premium contact card on android without a subscription',
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
      },
    });
  });

  return (
    <Container style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          middleElement={intl.formatMessage(
            {
              defaultMessage: 'Edit Contact Card{azzappA}',
              description: 'Edit Contact Card Modal title',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          )}
          leftElement={
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Cancel',
                description: 'Edit contact card modal cancel button title',
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
                description: 'Edit contact card modal save button label',
              })}
              testID="save-contact-card"
              loading={isSubmitting || loading}
              onPress={submit}
              variant="primary"
              style={styles.headerButton}
            />
          }
        />

        <ContactCardEditForm webCard={webCard} control={control} />
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
  );
};

const styles = StyleSheet.create({
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  container: { flex: 1 },
});

const contactCardEditScreen = relayScreen(ContactCardEditScreen, {
  query: contactCardEditScreenQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
    pixelRatio: CappedPixelRatio(),
  }),
});

contactCardEditScreen.getScreenOptions = (): ScreenOptions => ({
  stackAnimation: 'slide_from_bottom',
});

export default contactCardEditScreen;
