import { useCallback } from 'react';
import { Controller, useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { AVATAR_MAX_WIDTH } from '@azzapp/shared/contactCardHelpers';
import { colors, shadow } from '#theme';
import { MEDIA_WIDTH } from '#components/AuthorCartouche';
import FormDeleteFieldOverlay from '#components/ContactCard/FormDeleteFieldOverlay';
import { FILTERS, exportLayersToImage, isFilter } from '#components/gpu';
import ImagePicker, {
  ImagePickerContactCardMediaWrapper,
} from '#components/ImagePicker';
import { MediaImageRenderer } from '#components/medias';
import ScreenModal from '#components/ScreenModal';
import { buildContactCardModalStyleSheet } from '#helpers/contactCardHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import ContactCardEditModalAddresses from './ContactCardEditModalAddresses';
import ContactCardEditModalBirthdays from './ContactCardEditModalBirthday';
import ContactCardEditModalEmails from './ContactCardEditModalEmails';
import ContactCardEditModalPhones from './ContactCardEditModalPhones';
import ContactCardEditModalSocials from './ContactCardEditModalSocials';
import ContactCardEditModalUrls from './ContactCardEditModalUrls';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { ContactCardEditFormValues } from './ContactCardEditModalSchema';
import type { ContactCardEditModal_card$data } from '@azzapp/relay/artifacts/ContactCardEditModal_card.graphql';
import type { ReactNode } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';

type ContactCardEditFormProps = {
  isMultiUser: boolean;
  showImagePicker: () => void;
  hideImagePicker: () => void;
  imagePickerVisible: boolean;
  control: Control<ContactCardEditFormValues>;
  commonInformation: ContactCardEditModal_card$data['webCard']['commonInformation'];
  children?: ReactNode;
  footer?: ReactNode;
  errors?: FieldErrors<ContactCardEditFormValues>;
};

const ContactCardEditForm = ({
  isMultiUser,
  showImagePicker,
  hideImagePicker,
  imagePickerVisible,
  control,
  commonInformation,
  children,
  footer,
  errors,
}: ContactCardEditFormProps) => {
  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();

  const { field } = useController({
    control,
    name: 'avatar',
  });

  const onImagePickerFinished = useCallback(
    async ({
      uri,
      width,
      height,
      editionParameters,
      filter,
    }: ImagePickerResult) => {
      const aspectRatio = width / height;
      const exportWidth = Math.min(AVATAR_MAX_WIDTH, width);
      const exportHeight = exportWidth / aspectRatio;
      const localPath = await exportLayersToImage({
        size: { width: exportWidth, height: exportHeight },
        quality: 95,
        format: 'auto',
        layers: [
          {
            kind: 'image',
            uri,
            parameters: editionParameters,
            lutFilterUri: isFilter(filter) ? FILTERS[filter] : null,
          },
        ],
      });

      field.onChange({
        local: true,
        id: localPath,
        uri: `file://${localPath.replace('file://', '')}`,
      });

      hideImagePicker();
    },
    [field, hideImagePicker],
  );

  return (
    <>
      <FormDeleteFieldOverlay>
        <View style={styles.sectionsContainer}>
          {children}
          {isMultiUser ? (
            <View style={styles.avatarSection}>
              <PressableNative onPress={showImagePicker}>
                <Controller
                  control={control}
                  name="avatar"
                  render={({ field: { value } }) =>
                    value?.uri ? (
                      <View style={styles.avatarContainer}>
                        <MediaImageRenderer
                          source={{
                            uri: value.uri,
                            mediaId: value.id ?? '',
                            requestedSize: MEDIA_WIDTH,
                          }}
                          style={styles.avatar}
                        />
                        <IconButton
                          icon="delete_filled"
                          variant="icon"
                          iconStyle={styles.removeAvatarIcon}
                          style={styles.removeAvatarButton}
                          onPress={() => field.onChange(undefined)}
                        />
                      </View>
                    ) : (
                      <View style={styles.noAvatar}>
                        <Icon icon="add" />
                      </View>
                    )
                  }
                />
              </PressableNative>
            </View>
          ) : null}

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text variant="smallbold" style={styles.fieldTitle}>
                  <FormattedMessage
                    defaultMessage="First name"
                    description="First name registered for the contact card"
                  />
                </Text>
                <TextInput
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  clearButtonMode="while-editing"
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Enter a first name',
                    description:
                      'Placeholder for first name inside contact card',
                  })}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text variant="smallbold" style={styles.fieldTitle}>
                  <FormattedMessage
                    defaultMessage="Last name"
                    description="Last name field registered for the contact card"
                  />
                </Text>
                <TextInput
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  clearButtonMode="while-editing"
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Enter a last name',
                    description: 'Placeholder for last name contact card',
                  })}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text variant="smallbold" style={styles.fieldTitle}>
                  <FormattedMessage
                    defaultMessage="Title"
                    description="Job title field registered for the contact card"
                  />
                </Text>
                <TextInput
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  clearButtonMode="while-editing"
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Enter a title',
                    description: 'Placeholder for title inside contact card',
                  })}
                />
              </View>
            )}
          />

          {commonInformation?.company ? (
            <View style={styles.field}>
              <View style={styles.fieldTitleWithLock}>
                <Icon icon="locked" />
                <Text variant="smallbold" style={styles.fieldTitle}>
                  <FormattedMessage
                    defaultMessage="Company"
                    description="Company name field registered for the contact card"
                  />
                </Text>
              </View>
              <Text variant="medium">{commonInformation.company}</Text>
            </View>
          ) : (
            <Controller
              control={control}
              name="company"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text variant="smallbold" style={styles.fieldTitle}>
                    <FormattedMessage
                      defaultMessage="Company"
                      description="Company name field registered for the contact card"
                    />
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={styles.input}
                    clearButtonMode="while-editing"
                    placeholder={intl.formatMessage({
                      defaultMessage: 'Enter a company name',
                      description:
                        'Placeholder for company name inside contact card',
                    })}
                  />
                </View>
              )}
            />
          )}

          <View style={styles.separator} />
          {commonInformation?.phoneNumbers?.map((phoneNumber, index) => (
            <CommonInformationField
              key={index}
              label={phoneNumber.label}
              value={phoneNumber.number}
            />
          ))}
          <ContactCardEditModalPhones control={control} />
          <View style={styles.separator} />
          {commonInformation?.emails?.map((email, index) => (
            <CommonInformationField
              key={index}
              label={email.label}
              value={email.address}
            />
          ))}
          <ContactCardEditModalEmails control={control} />
          <View style={styles.separator} />
          {commonInformation?.urls?.map((url, index) => (
            <CommonInformationField key={index} value={url.address} />
          ))}
          <ContactCardEditModalUrls control={control} errors={errors} />
          <View style={styles.separator} />
          {commonInformation?.addresses?.map((address, index) => (
            <CommonInformationField
              key={index}
              label={address.label}
              value={address.address}
            />
          ))}
          <ContactCardEditModalAddresses control={control} />
          <View style={styles.separator} />
          <ContactCardEditModalBirthdays control={control} />
          <View style={styles.separator} />
          {commonInformation?.socials?.map((social, index) => (
            <CommonInformationField
              key={index}
              label={social.label}
              value={social.url}
            />
          ))}
          <ContactCardEditModalSocials control={control} />
        </View>
        {footer}
      </FormDeleteFieldOverlay>

      <ScreenModal visible={imagePickerVisible} animationType="slide">
        <ImagePicker
          kind="image"
          forceAspectRatio={1}
          TopPanelWrapper={ImagePickerContactCardMediaWrapper}
          onFinished={onImagePickerFinished}
          onCancel={hideImagePicker}
          cameraButtonsLeftRightPosition={70}
        />
      </ScreenModal>
    </>
  );
};

const CommonInformationField = ({
  label,
  value,
}: {
  label?: string;
  value: string;
}) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View style={styles.field}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 5,
        }}
      >
        <Icon icon="locked" />
        {label ? <Text variant="smallbold">{label}</Text> : null}
      </View>
      <Text variant="medium">{value}</Text>
    </View>
  );
};

const AVATAR_WIDTH = 112;
const ICON_WIDTH = 24;

const styleSheet = createStyleSheet(appearance => ({
  avatarSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  noAvatar: {
    width: AVATAR_WIDTH,
    height: AVATAR_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.grey50,
    borderRadius: AVATAR_WIDTH / 2,
  },
  avatar: {
    width: AVATAR_WIDTH,
    height: AVATAR_WIDTH,
    borderRadius: AVATAR_WIDTH / 2,
    borderWidth: 4,
    borderColor: appearance === 'dark' ? colors.black : colors.white,
    overflow: 'visible',
  },
  fieldTitle: { minWidth: 100 },
  fieldTitleWithLock: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  avatarContainer: [
    { overflow: 'visible', position: 'relative' },
    shadow(appearance, 'bottom'),
  ],
  removeAvatarButton: {
    position: 'absolute',
    top: AVATAR_WIDTH / 2 - ICON_WIDTH / 2,
    left: -ICON_WIDTH - 20,
  },
  removeAvatarIcon: {
    tintColor: colors.red400,
  },
  ...buildContactCardModalStyleSheet(appearance),
}));

export default ContactCardEditForm;
