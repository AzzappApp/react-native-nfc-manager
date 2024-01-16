import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import * as mime from 'react-native-mime-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { Observable } from 'relay-runtime';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import ScreenModal from '#components/ScreenModal';
import { getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import UploadProgressModal from '#ui/UploadProgressModal';

import ContactCardEditForm from './ContactCardEditForm';
import { contactCardEditSchema } from './ContactCardEditModalSchema';
import type { ContactCardEditModal_card$key } from '#relayArtifacts/ContactCardEditModal_card.graphql';
import type { ContactCardEditFormValues } from './ContactCardEditModalSchema';

export type ContactCardEditModalProps = {
  visible: boolean;
  toggleBottomSheet: () => void;
  profile: ContactCardEditModal_card$key;
};

const ContactCardEditModal = ({
  toggleBottomSheet,
  profile: profileKey,
}: ContactCardEditModalProps) => {
  const {
    contactCard,
    webCard: { commonInformation, isMultiUser },
    avatar,
  } = useFragment(
    graphql`
      fragment ContactCardEditModal_card on Profile
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
      ) {
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
        serializedContactCard {
          data
          signature
        }
        avatar {
          id
          uri: uri(width: 112, pixelRatio: $pixelRatio)
        }
      }
    `,
    profileKey,
  );

  const [commit] = useMutation(graphql`
    mutation ContactCardEditModalMutation(
      $input: SaveContactCardInput!
      $pixelRatio: Float!
    ) {
      saveContactCard(input: $input) {
        profile {
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
          serializedContactCard {
            data
            signature
          }
          avatar {
            id
            uri: uri(width: 112, pixelRatio: $pixelRatio)
          }
        }
      }
    }
  `);

  const intl = useIntl();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactCardEditFormValues>({
    mode: 'onBlur',
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
    },
  });

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const submit = handleSubmit(
    async ({ avatar, ...data }) => {
      let avatarId: string | null = avatar?.id ?? null;
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
          target: 'post',
        });
        const { progress: uploadProgress, promise: uploadPromise } =
          uploadMedia(file, uploadURL, uploadParameters);
        setProgressIndicator(uploadProgress);
        const { public_id } = await uploadPromise;
        avatarId = encodeMediaId(public_id, 'image');
      }

      commit({
        variables: {
          input: {
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
          },
          pixelRatio: CappedPixelRatio(),
        },
        onCompleted: () => {
          if (avatarId && avatar?.uri) {
            addLocalCachedMediaFile(
              `${'image'.slice(0, 1)}:${avatarId}`,
              'image',
              avatar.uri,
            );
          }
          toggleBottomSheet();
        },
        onError: e => {
          console.error(e);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage:
                'Error, could not save your contact card. Please try again.',
              description:
                'Error toast message when saving contact card failed',
            }),
          });
        },
      });
    },
    error => {
      console.log(error);
    },
  );

  const [showImagePicker, setShowImagePicker] = useState(false);

  return (
    <Container style={styles.container}>
      <SafeAreaView>
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Edit Contact Card',
            description: 'Edit Contact Card Modal title',
          })}
          leftElement={
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Cancel',
                description: 'Edit contact card modal cancel button title',
              })}
              onPress={toggleBottomSheet}
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

        <ContactCardEditForm
          commonInformation={commonInformation}
          isMultiUser={isMultiUser}
          control={control}
          showImagePicker={() => setShowImagePicker(true)}
          hideImagePicker={() => setShowImagePicker(false)}
          imagePickerVisible={showImagePicker}
          errors={errors}
        />
        <ScreenModal visible={!!progressIndicator}>
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

export default ContactCardEditModal;
