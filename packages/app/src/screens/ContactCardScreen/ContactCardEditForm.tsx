import { Fragment, useCallback } from 'react';
import { Controller, useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { AVATAR_MAX_WIDTH } from '@azzapp/shared/contactCardHelpers';
import { colors, shadow } from '#theme';
import { MEDIA_WIDTH } from '#components/AuthorCartouche';
import FormDeleteFieldOverlay from '#components/ContactCard/FormDeleteFieldOverlay';
import { exportLayersToImage, getFilterUri } from '#components/gpu';
import ImagePicker, {
  EditImageStep,
  ImagePickerContactCardMediaWrapper,
  SelectImageStepWithFrontCameraByDefault,
} from '#components/ImagePicker';
import { MediaImageRenderer } from '#components/medias';
import ScreenModal from '#components/ScreenModal';
import { buildContactCardModalStyleSheet } from '#helpers/contactCardHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import ContactCardEditModalAddresses from './ContactCardEditModalAddresses';
import ContactCardEditModalBirthdays from './ContactCardEditModalBirthday';
import ContactCardEditModalEmails from './ContactCardEditModalEmails';
import ContactCardEditModalPhones from './ContactCardEditModalPhones';
import ContactCardEditModalSocials from './ContactCardEditModalSocials';
import ContactCardEditModalUrls from './ContactCardEditModalUrls';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { ContactCardEditModal_card$data } from '#relayArtifacts/ContactCardEditModal_card.graphql';
import type { ContactCardEditFormValues } from './ContactCardEditModalSchema';
import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';

type ContactCardEditFormProps = {
  isMultiUser: boolean;
  showImagePicker: () => void;
  hideImagePicker: () => void;
  imagePickerVisible: boolean;
  control: Control<ContactCardEditFormValues>;
  commonInformation: ContactCardEditModal_card$data['webCard']['commonInformation'];
  children?: ReactNode;
  footer?: ReactNode;
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
      editionParameters,
      filter,
      aspectRatio,
    }: ImagePickerResult) => {
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
            lutFilterUri: getFilterUri(filter),
          },
        ],
      });
      field.onChange({
        local: true,
        id: localPath,
        uri: localPath.startsWith('file://')
          ? localPath
          : `file://${localPath}`,
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
              <Controller
                control={control}
                name="avatar"
                render={({ field: { value, onChange } }) =>
                  value?.uri ? (
                    <View style={styles.avatarContainer}>
                      <PressableNative
                        onPress={showImagePicker}
                        android_ripple={{ borderless: true, foreground: true }}
                      >
                        <MediaImageRenderer
                          source={{
                            uri: value.uri,
                            mediaId: value.id ?? '',
                            requestedSize: MEDIA_WIDTH,
                          }}
                          style={styles.avatar}
                        />
                      </PressableNative>
                      <IconButton
                        icon="delete_filled"
                        variant="icon"
                        iconStyle={styles.removeAvatarIcon}
                        style={styles.removeAvatarButton}
                        onPress={() => onChange(null)}
                      />
                    </View>
                  ) : (
                    <View style={styles.noAvatarContainer}>
                      <PressableNative
                        onPress={showImagePicker}
                        android_ripple={{ borderless: true, foreground: true }}
                      >
                        <View style={styles.noAvatar}>
                          <Icon icon="add" />
                        </View>
                      </PressableNative>
                    </View>
                  )
                }
              />
            </View>
          ) : null}
          <Separation small />
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value, ref } }) => (
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
                  ref={ref}
                />
              </View>
            )}
          />
          <Separation small />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value, ref } }) => (
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
                  ref={ref}
                />
              </View>
            )}
          />
          <Separation small />
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value, ref } }) => (
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
                  ref={ref}
                />
              </View>
            )}
          />
          <Separation />
          {isMultiUser && commonInformation?.company ? (
            <View style={styles.fieldCommon}>
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
              render={({ field: { onChange, onBlur, value, ref } }) => (
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
                    ref={ref}
                  />
                </View>
              )}
            />
          )}

          <Separation />
          {isMultiUser &&
            commonInformation?.phoneNumbers?.map((phoneNumber, index) => (
              <Fragment key={index}>
                <CommonInformationField
                  label={phoneNumber.label}
                  value={phoneNumber.number}
                  labelMargin={54}
                />
                <Separation small />
              </Fragment>
            ))}
          <ContactCardEditModalPhones control={control} />
          <Separation />
          {isMultiUser &&
            commonInformation?.emails?.map((email, index) => (
              <Fragment key={index}>
                <CommonInformationField
                  label={email.label}
                  value={email.address}
                  labelMargin={54}
                />
                <Separation small />
              </Fragment>
            ))}
          <ContactCardEditModalEmails control={control} />
          <Separation />
          {isMultiUser &&
            commonInformation?.urls?.map((url, index) => (
              <Fragment key={index}>
                <CommonInformationField value={url.address} labelMargin={18} />
                <Separation small />
              </Fragment>
            ))}
          <ContactCardEditModalUrls control={control} />
          <Separation />
          {isMultiUser &&
            commonInformation?.addresses?.map((address, index) => (
              <CommonInformationField
                key={index}
                label={address.label}
                value={address.address}
                labelMargin={54}
              />
            ))}
          <ContactCardEditModalAddresses control={control} />
          <Separation />
          <ContactCardEditModalBirthdays control={control} />
          <Separation />
          {isMultiUser &&
            commonInformation?.socials?.map((social, index) => (
              <Fragment key={index}>
                <CommonInformationField
                  label={social.label}
                  value={social.url}
                  labelMargin={47}
                />
                <Separation small />
              </Fragment>
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
          steps={steps}
          onFinished={onImagePickerFinished}
          onCancel={hideImagePicker}
          cameraButtonsLeftRightPosition={70}
        />
      </ScreenModal>
    </>
  );
};

export const steps = [SelectImageStepWithFrontCameraByDefault, EditImageStep];

const CommonInformationField = ({
  label,
  value,
  labelMargin,
}: {
  label?: string;
  value: string;
  labelMargin?: number;
}) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View style={styles.fieldCommon}>
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
      <Text
        style={{
          marginLeft: labelMargin ?? (label ? 50 : 20),
          flex: 1,
        }}
        variant="medium"
      >
        {value}
      </Text>
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
  noAvatarContainer: {
    overflow: 'hidden',
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
    {
      position: 'relative',
      borderRadius: AVATAR_WIDTH / 2,
    },
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
