import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import * as mime from 'react-native-mime-types';
import Toast from 'react-native-toast-message';
import { graphql, useMutation, usePreloadedQuery } from 'react-relay';
import { Observable } from 'relay-runtime';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { combineMultiUploadProgresses } from '@azzapp/shared/networkHelpers';
import {
  preventModalDismiss,
  useRouter,
  ScreenModal,
} from '#components/NativeRouter';
import { getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import relayScreen from '#helpers/relayScreen';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import { get as QRCodeWidth } from '#relayProviders/qrCodeWidth.relayprovider';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';
import UploadProgressModal from '#ui/UploadProgressModal';
import ContactCardEditForm from './ContactCardEditForm';
import { contactCardEditSchema } from './ContactCardEditModalSchema';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactCardEditScreenQuery } from '#relayArtifacts/ContactCardEditScreenQuery.graphql';
import type { ContactCardEditRoute } from '#routes';
import type { ContactCardEditFormValues } from './ContactCardEditModalSchema';

const contactCardEditScreenQuery = graphql`
  query ContactCardEditScreenQuery($profileId: ID!, $pixelRatio: Float!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        id
        webCard {
          isMultiUser
          commonInformation {
            company
            addresses {
              address
              label
            }
            emails {
              label
              address
            }
            phoneNumbers {
              label
              number
            }
            urls {
              address
            }
            socials {
              label
              url
            }
          }
          logo {
            id
            uri: uri(width: 180, pixelRatio: $pixelRatio)
          }
        }
        contactCard {
          firstName
          lastName
          title
          company
          emails {
            label
            address
            selected
          }
          phoneNumbers {
            label
            number
            selected
          }
          urls {
            address
            selected
          }
          addresses {
            address
            label
            selected
          }
          birthday {
            birthday
            selected
          }
          socials {
            url
            label
            selected
          }
        }
        avatar {
          id
          uri: uri(width: 112, pixelRatio: $pixelRatio)
        }
        logo {
          id
          uri: uri(width: 180, pixelRatio: $pixelRatio)
        }
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

  const { id, contactCard, webCard, avatar, logo } = profile ?? {
    id: null,
    contactCard: null,
    webCard: null,
    avatar: null,
    logo: null,
  };

  const [commit] = useMutation(graphql`
    mutation ContactCardEditScreenMutation(
      $profileId: ID!
      $contactCard: ContactCardInput!
      $pixelRatio: Float!
      $width: Int!
    ) {
      saveContactCard(profileId: $profileId, contactCard: $contactCard) {
        profile {
          id
          contactCard {
            firstName
            lastName
            title
            company
            emails {
              label
              address
              selected
            }
            phoneNumbers {
              label
              number
              selected
            }
            urls {
              address
              selected
            }
            addresses {
              address
              label
              selected
            }
            birthday {
              birthday
              selected
            }
            socials {
              url
              label
              selected
            }
          }
          contactCardUrl
          contactCardQrCode(width: $width)
          lastContactCardUpdate
          createdAt
          avatar {
            id
            uri: uri(width: 112, pixelRatio: $pixelRatio)
          }
          logo {
            id
            uri: uri(width: 180, pixelRatio: $pixelRatio)
          }
        }
      }
    }
  `);

  const intl = useIntl();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ContactCardEditFormValues>({
    mode: 'onBlur',
    shouldFocusError: true,
    resolver: zodResolver(contactCardEditSchema),
    defaultValues: {
      ...contactCard,
      company: contactCard?.company ?? '',
      emails: contactCard?.emails?.map(m => ({ ...m })) ?? [],
      phoneNumbers: contactCard?.phoneNumbers?.map(p => ({ ...p })) ?? [],
      urls: contactCard?.urls?.map(p => ({ ...p })) ?? [],
      addresses: contactCard?.addresses?.map(p => ({ ...p })) ?? [],
      birthday: contactCard?.birthday,
      socials: contactCard?.socials?.map(p => ({ ...p })) ?? [],
      avatar,
      logo,
    },
  });

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const router = useRouter();

  const submit = handleSubmit(async ({ avatar, logo, ...data }) => {
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

    if (logo?.local && logo.uri) {
      setProgressIndicator(Observable.from(0));

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

    setProgressIndicator(
      combineMultiUploadProgresses(
        convertToNonNullArray(uploads.map(upload => upload?.progress)),
      ),
    );

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
        profileId: id,
        contactCard: {
          ...data,
          emails: data.emails.filter(email => email.address),
          phoneNumbers: data.phoneNumbers.filter(
            phoneNumber => phoneNumber.number,
          ),
          urls: data.urls.filter(url => url.address),
          addresses: data.addresses.filter(address => address.address),
          birthday: data.birthday,
          socials: data.socials.filter(social => social.url),
          avatarId,
          logoId,
        },
        pixelRatio: CappedPixelRatio(),
        width: QRCodeWidth(),
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
      updater: store => {
        if (id) {
          const user = store.getRoot().getLinkedRecord('currentUser');
          const profiles = user?.getLinkedRecords('profiles');

          if (profiles) {
            const profile = profiles?.find(
              profile => profile.getDataID() === id,
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
          ) as string,
        });
      },
    });
  });

  return (
    <Container style={styles.container}>
      <SafeAreaView
        style={{ flex: 1 }}
        edges={{ bottom: 'off', top: 'additive' }}
      >
        <Header
          middleElement={
            intl.formatMessage(
              {
                defaultMessage: 'Edit Contact Card{azzappA}',
                description: 'Edit Contact Card Modal title',
              },
              {
                azzappA: <Text variant="azzapp">a</Text>,
              },
            ) as string
          }
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
              loading={isSubmitting}
              onPress={submit}
              variant="primary"
              style={styles.headerButton}
            />
          }
        />

        {webCard && <ContactCardEditForm webCard={webCard} control={control} />}
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
  bottomSheetContainerStyle: { paddingHorizontal: 0 },
  headerStyle: { paddingHorizontal: 10 },
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
