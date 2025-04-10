import { ImageFormat } from '@shopify/react-native-skia';
import { Fragment, useCallback, useState } from 'react';
import { Controller, useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import * as mime from 'react-native-mime-types';
import { AVATAR_MAX_WIDTH } from '@azzapp/shared/contactCardHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import FormDeleteFieldOverlay from '#components/FormDeleteFieldOverlay';
import ImagePicker, {
  EditImageStep,
  ImagePickerContactCardMediaWrapper,
  SelectImageStep,
  SelectImageStepWithFrontCameraByDefault,
} from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import {
  MAX_FIELD_HEIGHT,
  buildContactStyleSheet,
} from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { saveTransformedImageToFile } from '#helpers/mediaEditions';
import Icon from '#ui/Icon';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import ContactCardEditModalAddresses from './ContactCardEditAddresses';
import ContactCardEditModalAvatar from './ContactCardEditAvatar';
import ContactCardEditModalBirthdays from './ContactCardEditBirthday';
import ContactCardEditCompanyLogo from './ContactCardEditCompanyLogo';
import ContactCardEditModalEmails from './ContactCardEditEmails';
import ContactCardEditModalName from './ContactCardEditName';
import ContactCardEditModalPhones from './ContactCardEditPhones';
import ContactCardEditModalSocials from './ContactCardEditSocials';
import ContactCardEditModalUrls from './ContactCardEditUrls';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { ContactCardEditFormFragment_profile$data } from '#relayArtifacts/ContactCardEditFormFragment_profile.graphql';
import type { ContactCardFormValues } from './ContactCardSchema';
import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';

type ContactCardEditFormProps = {
  control: Control<ContactCardFormValues>;
  webCard: NonNullable<
    NonNullable<ContactCardEditFormFragment_profile$data>
  >['webCard'];
  children?: ReactNode;
  footer?: ReactNode;
};

const ContactCardEditForm = ({
  control,
  children,
  footer,
  webCard,
}: ContactCardEditFormProps) => {
  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();

  const { field: avatarField } = useController({
    control,
    name: 'avatar',
  });

  const { field: logoField } = useController({
    control,
    name: 'logo',
  });

  const { field: companyField } = useController({
    control,
    name: 'company',
  });

  const [imagePicker, setImagePicker] = useState<'avatar' | 'logo' | null>(
    null,
  );

  const onImagePickerFinished = useCallback(
    async ({
      uri,
      width,
      editionParameters,
      filter,
      aspectRatio,
    }: ImagePickerResult) => {
      const mimeType =
        mime.lookup(uri) === 'image/png' ? ImageFormat.PNG : ImageFormat.JPEG;

      if (imagePicker === 'avatar') {
        const exportWidth = Math.min(AVATAR_MAX_WIDTH, width);
        const exportHeight = exportWidth / aspectRatio;
        const localPath = await saveTransformedImageToFile({
          uri,
          resolution: { width: exportWidth, height: exportHeight },
          format: mimeType,
          quality: 95,
          filter,
          editionParameters,
        });
        avatarField.onChange({
          local: true,
          id: localPath,
          uri: localPath,
        });
      } else {
        const exportWidth = width;
        const exportHeight = exportWidth / aspectRatio;
        const localPath = await saveTransformedImageToFile({
          uri,
          resolution: { width: exportWidth, height: exportHeight },
          format: mimeType,
          quality: 95,
          filter,
          editionParameters,
        });
        logoField.onChange({
          local: true,
          id: localPath,
          uri: localPath,
        });
      }

      setImagePicker(null);
    },
    [avatarField, imagePicker, logoField],
  );

  const { commonInformation } = webCard ?? {};

  return (
    <>
      <FormDeleteFieldOverlay keyboardShouldPersistTaps="handled">
        <View style={styles.sectionsContainer}>
          {children}
          <ContactCardEditModalAvatar
            control={control}
            onPickerRequested={() => setImagePicker('avatar')}
          />
          <Separation small />
          <ContactCardEditModalName control={control} />
          <Separation />
          {webCard?.isMultiUser && commonInformation?.company ? (
            <View style={styles.fieldCommon}>
              <View style={styles.fieldTitleWithLock}>
                <Icon icon="locked" />
                <Text variant="smallbold" style={styles.fieldTitleLocked}>
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
                    value={value ?? undefined}
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
                  <PremiumIndicator
                    isRequired={!webCard?.isPremium}
                    color={value ? undefined : colors.grey100}
                  />
                </View>
              )}
            />
          )}
          <Separation small />
          <ContactCardEditCompanyLogo
            control={control}
            canEditLogo={!webCard?.isMultiUser || !webCard?.logo}
            company={
              (webCard?.isMultiUser && commonInformation?.company) ||
              companyField.value
            }
            isPremium={webCard?.isPremium}
            isUserContactCard
          />
          <Separation />
          {webCard?.isMultiUser &&
            commonInformation?.phoneNumbers?.map((phoneNumber, index) => (
              <Fragment key={index}>
                <CommonInformationField
                  label={phoneNumber.label}
                  value={phoneNumber.number}
                />
                <Separation small />
              </Fragment>
            ))}
          <ContactCardEditModalPhones control={control} />
          <Separation />
          {webCard?.isMultiUser &&
            commonInformation?.emails?.map((email, index) => (
              <Fragment key={index}>
                <CommonInformationField
                  label={email.label}
                  value={email.address}
                />
                <Separation small />
              </Fragment>
            ))}
          <ContactCardEditModalEmails control={control} />
          <Separation />
          {webCard?.userName && (
            <View style={styles.fieldCommon}>
              <View style={styles.fieldTitleWithLock}>
                <Icon icon="locked" />
                <Text variant="smallbold" style={styles.azzappUrlHeader}>
                  <FormattedMessage
                    defaultMessage="azzapp"
                    description="contactCard edit screen / azzapp url row header"
                  />
                </Text>
              </View>
              <Text variant="medium" style={{ flex: 1 }}>
                {buildUserUrl(webCard?.userName || '')}
              </Text>
            </View>
          )}
          {webCard?.isMultiUser &&
            commonInformation?.urls?.map((url, index) => (
              <Fragment key={`commonUrl-${index}`}>
                <CommonInformationField value={url.address} />
                <Separation small />
              </Fragment>
            ))}
          <ContactCardEditModalUrls
            control={control}
            isPremium={webCard?.isPremium}
          />
          <Separation />
          {webCard?.isMultiUser &&
            commonInformation?.addresses?.map((address, index) => (
              <CommonInformationField
                key={index}
                label={address.label}
                value={address.address}
              />
            ))}
          <ContactCardEditModalAddresses control={control} />
          <Separation />
          <ContactCardEditModalBirthdays control={control} />
          <Separation />
          {webCard?.isMultiUser &&
            commonInformation?.socials?.map((social, index) => (
              <Fragment key={index}>
                <CommonInformationField
                  label={social.label}
                  value={social.url}
                />
                <Separation small />
              </Fragment>
            ))}
          <ContactCardEditModalSocials control={control} />
        </View>
        {footer}
      </FormDeleteFieldOverlay>

      <ScreenModal
        visible={imagePicker !== null}
        animationType="slide"
        onRequestDismiss={() => setImagePicker(null)}
      >
        <ImagePicker
          kind="image"
          forceAspectRatio={imagePicker === 'avatar' ? 1 : undefined}
          TopPanelWrapper={
            imagePicker === 'avatar'
              ? ImagePickerContactCardMediaWrapper
              : undefined
          }
          steps={
            imagePicker === 'avatar'
              ? [SelectImageStepWithFrontCameraByDefault, EditImageStep]
              : [SelectImageStep]
          }
          onFinished={onImagePickerFinished}
          onCancel={() => {
            setImagePicker(null);
          }}
          cameraButtonsLeftRightPosition={
            imagePicker === 'avatar' ? 70 : undefined
          }
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
    <View style={styles.fieldCommon}>
      <View
        style={label ? styles.commonInfoHeader : styles.commonInfoHeaderNoLabel}
      >
        <Icon icon="locked" />
        {label ? <Text variant="smallbold">{label}</Text> : null}
      </View>
      <Text style={styles.commonInfoValue} variant="medium">
        {value}
      </Text>
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  fieldTitleWithLock: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  companyLogoDescription: {
    paddingLeft: 30,
    paddingVertical: 10,
  },
  logoField: {
    paddingVertical: 20,
    paddingStart: 10,
    paddingEnd: 20,
    borderColor: colors.grey50,
    borderTopWidth: 1,
  },
  logoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 7,
  },
  logoContainer: {
    flex: 1,
    paddingLeft: 65,
    alignItems: 'flex-start',
  },
  logoWrapper: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.grey100,
    borderRadius: 5,
  },
  azzappUrlHeader: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    marginLeft: 5,
    marginRight: 16,
  },
  commonInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
    minWidth: 140,
  },
  commonInfoHeaderNoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
    minWidth: 35,
  },
  commonInfoValue: {
    flex: 1,
    maxHeight: MAX_FIELD_HEIGHT,
  },
  fieldTitleLocked: { minWidth: 130 },
  ...buildContactStyleSheet(appearance),
}));

export default ContactCardEditForm;
