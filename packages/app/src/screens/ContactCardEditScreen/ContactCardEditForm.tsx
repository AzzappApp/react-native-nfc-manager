import { ImageFormat } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Controller, useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { Pressable, View } from 'react-native';
import ImageSize from 'react-native-image-size';
import * as mime from 'react-native-mime-types';
import { AVATAR_MAX_WIDTH } from '@azzapp/shared/contactCardHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import FormDeleteFieldOverlay from '#components/ContactCard/FormDeleteFieldOverlay';
import ImagePicker, {
  EditImageStep,
  ImagePickerContactCardMediaWrapper,
  SelectImageStep,
  SelectImageStepWithFrontCameraByDefault,
} from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import {
  MAX_FIELD_HEIGHT,
  buildContactCardModalStyleSheet,
} from '#helpers/contactCardHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { saveTransformedImageToFile } from '#helpers/mediaEditions';
import Icon from '#ui/Icon';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import ContactCardEditModalAddresses from './ContactCardEditModalAddresses';
import ContactCardEditModalAvatar from './ContactCardEditModalAvatar';
import ContactCardEditModalBirthdays from './ContactCardEditModalBirthday';
import ContactCardEditModalEmails from './ContactCardEditModalEmails';
import ContactCardEditModalName from './ContactCardEditModalName';
import ContactCardEditModalPhones from './ContactCardEditModalPhones';
import ContactCardEditModalSocials from './ContactCardEditModalSocials';
import ContactCardEditModalUrls from './ContactCardEditModalUrls';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { ContactCardEditScreenQuery$data } from '#relayArtifacts/ContactCardEditScreenQuery.graphql';
import type { ContactCardFormValues } from './ContactCardSchema';
import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';

type ContactCardEditFormProps = {
  control: Control<ContactCardFormValues>;
  webCard: NonNullable<
    NonNullable<ContactCardEditScreenQuery$data['node']>['profile']
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
  const [imagePicker, setImagePicker] = useState<'avatar' | 'logo' | null>(
    null,
  );

  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    if (logoField.value?.uri) {
      ImageSize.getSize(logoField.value.uri).then(({ width, height }) => {
        setSize(size => (size ? size : { width, height }));
      });
    }
  }, [logoField.value?.uri]);

  const onImagePickerFinished = useCallback(
    async ({
      uri,
      width,
      editionParameters,
      filter,
      aspectRatio,
    }: ImagePickerResult) => {
      if (imagePicker === 'avatar') {
        const exportWidth = Math.min(AVATAR_MAX_WIDTH, width);
        const exportHeight = exportWidth / aspectRatio;
        const localPath = await saveTransformedImageToFile({
          uri,
          resolution: { width: exportWidth, height: exportHeight },
          format: ImageFormat.JPEG,
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
        const mimeType =
          mime.lookup(uri) === 'image/png' ? ImageFormat.PNG : ImageFormat.JPEG;
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
        setSize({
          width: exportWidth,
          height: exportHeight,
        });
      }

      setImagePicker(null);
    },
    [avatarField, imagePicker, logoField],
  );

  const { commonInformation, logo } = webCard ?? {};

  const [webCardLogoSize, setWebCardLogoSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (logo?.uri) {
      ImageSize.getSize(logo.uri).then(({ width, height }) => {
        setWebCardLogoSize({ width, height });
      });
    }
  }, [logo]);

  return (
    <>
      <FormDeleteFieldOverlay>
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
                </View>
              )}
            />
          )}
          {webCard?.isMultiUser && logo ? (
            <View style={styles.logoField}>
              <View style={styles.logoButtonContainer}>
                <View style={styles.logoButton}>
                  <Icon icon="locked" style={{}} />
                  <Text variant="smallbold">
                    <FormattedMessage
                      defaultMessage="Logo"
                      description="Logo field registered for the contact card"
                    />
                  </Text>
                </View>

                {webCardLogoSize ? (
                  <View style={styles.logoContainer}>
                    <View style={styles.logoWrapper}>
                      <Image
                        source={{ uri: logo.uri }}
                        style={{
                          height: 55,
                          width:
                            webCardLogoSize.width *
                            (55 / webCardLogoSize.height),
                        }}
                        contentFit="contain"
                      />
                    </View>
                  </View>
                ) : null}
              </View>
              <View style={styles.companyLogoDescription}>
                <Text variant="xsmall" style={{ color: colors.grey400 }}>
                  <FormattedMessage
                    defaultMessage="Company logo will be used in your email signature"
                    description="Company logo field description"
                  />
                </Text>
              </View>
            </View>
          ) : (
            <Controller
              control={control}
              name="logo"
              render={({ field: { value, onChange } }) => (
                <View style={styles.logoField}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                      onPress={() => {
                        if (value?.uri) {
                          onChange(null);
                        } else {
                          setImagePicker('logo');
                        }
                      }}
                    >
                      <View style={styles.logoButton}>
                        <Icon
                          icon={value?.uri ? 'delete_filled' : 'add_filled'}
                          style={{
                            tintColor: value?.uri
                              ? colors.red400
                              : colors.green,
                          }}
                        />
                        <Text variant="smallbold">
                          <FormattedMessage
                            defaultMessage="Logo"
                            description="Logo field registered for the contact card"
                          />
                        </Text>
                      </View>
                    </Pressable>

                    {value?.uri && size ? (
                      <View style={styles.logoContainer}>
                        <Pressable
                          style={styles.logoWrapper}
                          onPress={() => setImagePicker('logo')}
                        >
                          <Image
                            source={{ uri: value?.uri }}
                            style={{
                              height: 55,
                              width: size.width * (55 / size.height),
                            }}
                            contentFit="contain"
                          />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.companyLogoDescription}>
                    <Text variant="xsmall" style={{ color: colors.grey400 }}>
                      <FormattedMessage
                        defaultMessage="Company logo will be used in your email signature"
                        description="Company logo field description"
                      />
                    </Text>
                  </View>
                </View>
              )}
            />
          )}

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
          <ContactCardEditModalUrls control={control} />
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
  logoButtonContainer: { flexDirection: 'row', alignItems: 'center' },
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
  ...buildContactCardModalStyleSheet(appearance),
}));

export default ContactCardEditForm;
