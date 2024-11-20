import { zodResolver } from '@hookform/resolvers/zod';
import { ImageFormat } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useController, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { Pressable, View } from 'react-native';
import ImageSize from 'react-native-image-size';
import * as mime from 'react-native-mime-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { graphql, useMutation, usePreloadedQuery } from 'react-relay';
import { Observable } from 'relay-runtime';
import { colors } from '#theme';
import { CancelHeaderButton } from '#components/commonsButtons';
import FormDeleteFieldOverlay from '#components/ContactCard/FormDeleteFieldOverlay';
import ImagePicker, { SelectImageStep } from '#components/ImagePicker';
import {
  useRouter,
  ScreenModal,
  preventModalDismiss,
} from '#components/NativeRouter';
import { buildContactCardModalStyleSheet } from '#helpers/contactCardHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getFileName } from '#helpers/fileHelpers';
import { saveTransformedImageToFile } from '#helpers/mediaEditions';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import relayScreen from '#helpers/relayScreen';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import LoadingScreen from '#screens/LoadingScreen';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import UploadProgressModal from '#ui/UploadProgressModal';
import CommonInformationAddresses from './CommonInformationAddresses';
import CommonInformationEmails from './CommonInformationEmails';
import CommonInformationPhones from './CommonInformationPhones';
import {
  commonInformationSchema,
  type CommonInformationForm as CommonInformationFormType,
} from './CommonInformationSchema';
import CommonInformationSocials from './CommonInformationSocials';
import CommonInformationUrls from './CommonInformationUrls';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CommonInformationScreenQuery } from '#relayArtifacts/CommonInformationScreenQuery.graphql';
import type { CommonInformationRoute } from '#routes';

const commonInformationScreenQuery = graphql`
  query CommonInformationScreenQuery($webCardId: ID!, $pixelRatio: Float!) {
    node(id: $webCardId) {
      ... on WebCard @alias(as: "webCard") {
        id
        logo {
          id
          uri(width: 180, pixelRatio: $pixelRatio)
        }
        commonInformation {
          company
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
          addresses {
            address
            label
          }
          socials {
            url
            label
          }
        }
      }
    }
  }
`;

export const CommonInformationScreen = ({
  preloadedQuery,
}: RelayScreenProps<CommonInformationRoute, CommonInformationScreenQuery>) => {
  const { node } = usePreloadedQuery(
    commonInformationScreenQuery,
    preloadedQuery,
  );

  const webCard = node?.webCard;

  const commonInformation = webCard?.commonInformation;

  const logo = webCard?.logo;

  const intl = useIntl();

  const styles = useStyleSheet(styleSheet);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<CommonInformationFormType>({
    mode: 'onBlur',
    resolver: zodResolver(commonInformationSchema),
    shouldFocusError: true,
    defaultValues: {
      ...commonInformation,
      emails: commonInformation?.emails?.map(m => ({ ...m })) ?? [],
      phoneNumbers: commonInformation?.phoneNumbers?.map(p => ({ ...p })) ?? [],
      urls: commonInformation?.urls?.map(p => ({ ...p })) ?? [],
      addresses: commonInformation?.addresses?.map(p => ({ ...p })) ?? [],
      socials: commonInformation?.socials?.map(p => ({ ...p })) ?? [],
      logo: logo
        ? {
            id: logo.id,
            uri: logo.uri,
            local: false,
          }
        : null,
    },
  });

  const { field } = useController({
    control,
    name: 'logo',
  });

  const [showImagePicker, setShowImagePicker] = useState(false);

  const onImagePickerFinished = useCallback(
    async ({
      uri,
      width,
      editionParameters,
      filter,
      aspectRatio,
    }: ImagePickerResult) => {
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
      field.onChange({
        local: true,
        id: localPath,
        uri: `file://${localPath}`,
      });

      setSize({
        width: exportWidth,
        height: exportHeight,
      });

      setShowImagePicker(false);
    },
    [field],
  );

  const [commit] = useMutation(graphql`
    mutation CommonInformationScreenMutation(
      $webCardId: ID!
      $input: SaveCommonInformationInput!
      $pixelRatio: Float!
    ) {
      saveCommonInformation(webCardId: $webCardId, input: $input) {
        webCard {
          id
          logo {
            id
            uri(width: 180, pixelRatio: $pixelRatio)
          }
          commonInformation {
            company
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
            addresses {
              address
              label
            }
            socials {
              url
              label
            }
          }
        }
      }
    }
  `);

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const submit = handleSubmit(
    async ({ logo, ...data }) => {
      let logoId: string | null = logo?.id ?? null;

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
        const { progress: uploadProgress, promise: uploadPromise } =
          uploadMedia(file, uploadURL, uploadParameters);
        setProgressIndicator(
          uploadProgress.map(({ loaded, total }) => loaded / total),
        );
        const { public_id } = await uploadPromise;
        logoId = public_id;
      }

      commit({
        variables: {
          webCardId: webCard?.id,
          input: {
            ...data,
            emails: data.emails.filter(email => email.address),
            phoneNumbers: data.phoneNumbers.filter(
              phoneNumber => phoneNumber.number,
            ),
            urls: data.urls.filter(url => url.address),
            addresses: data.addresses.filter(address => address.address),
            socials: data.socials.filter(social => social.url),
            logoId,
          },
          pixelRatio: CappedPixelRatio(),
        },
        onCompleted: () => {
          router.back();
        },
        onError: e => {
          console.error(e);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage:
                'Error, could not save the common information. Please try again.',
              description:
                'Error toast message when saving common information failed',
            }),
          });
        },
      });
    },
    error => {
      console.log(error);
    },
  );

  const [size, setSize] = useState<
    { width: number; height: number } | undefined
  >(undefined);

  useEffect(() => {
    if (logo?.uri) {
      ImageSize.getSize(logo.uri).then(({ width, height }) => {
        setSize(size => (size ? size : { width, height }));
      });
    }
  }, [logo?.uri]);

  const router = useRouter();

  return (
    <Container
      style={{
        flex: 1,
      }}
    >
      <SafeAreaView
        style={{ flex: 1 }}
        edges={{ bottom: 'additive', top: 'additive' }}
      >
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Common information',
            description: 'Common information form header title',
          })}
          leftElement={
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Cancel',
                description: 'Edit common information cancel button title',
              })}
              onPress={() => {
                reset({
                  ...commonInformation,
                  emails: commonInformation?.emails?.map(m => ({ ...m })) ?? [],
                  phoneNumbers:
                    commonInformation?.phoneNumbers?.map(p => ({
                      ...p,
                    })) ?? [],
                  urls: commonInformation?.urls?.map(p => ({ ...p })) ?? [],
                  addresses:
                    commonInformation?.addresses?.map(p => ({
                      ...p,
                    })) ?? [],
                  socials:
                    commonInformation?.socials?.map(p => ({ ...p })) ?? [],
                });
                router.back();
              }}
              variant="secondary"
              style={styles.headerButton}
            />
          }
          rightElement={
            <Button
              testID="save-common-information"
              label={intl.formatMessage({
                defaultMessage: 'Save',
                description: 'Edit common information save button label',
              })}
              loading={isSubmitting}
              onPress={submit}
              variant="primary"
              style={styles.headerButton}
            />
          }
        />
        <FormDeleteFieldOverlay>
          <View style={styles.sectionsContainer}>
            <View style={styles.container}>
              <Icon icon="lock_line" style={styles.icon} />
              <Text variant="xsmall" style={styles.description}>
                <FormattedMessage
                  defaultMessage="Common information will be displayed on each team member’s Contact Card{azzappA} and won’t be editable."
                  description="Common information form description"
                  values={{
                    azzappA: <Text variant="azzapp">a</Text>,
                  }}
                />
              </Text>
            </View>

            <Controller
              control={control}
              name="company"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text variant="smallbold" style={styles.fieldName}>
                    <FormattedMessage
                      defaultMessage="Company"
                      description="Company name field registered for the contact card"
                    />
                  </Text>
                  <TextInput
                    value={value ?? ''}
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
                          setShowImagePicker(true);
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
                          onPress={() => setShowImagePicker(true)}
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
            <Separation />
            <CommonInformationAddresses control={control} />
            <Separation />
            <CommonInformationPhones control={control} />
            <Separation />
            <CommonInformationEmails control={control} />
            <Separation />
            <CommonInformationUrls control={control} />
            <Separation />
            <CommonInformationSocials control={control} />
          </View>
        </FormDeleteFieldOverlay>

        <ScreenModal
          visible={showImagePicker}
          onRequestDismiss={() => setShowImagePicker(false)}
        >
          <ImagePicker
            onFinished={onImagePickerFinished}
            onCancel={() => setShowImagePicker(false)}
            steps={[SelectImageStep]}
            kind="image"
          />
        </ScreenModal>
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

const CommonInformationScreenFallback = () => {
  const router = useRouter();
  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header leftElement={<CancelHeaderButton onPress={router.back} />} />
        <View style={{ aspectRatio: 1, backgroundColor: colors.grey100 }} />
        <LoadingScreen />
      </SafeAreaView>
    </Container>
  );
};

const commonInfoScreen = relayScreen(CommonInformationScreen, {
  query: commonInformationScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
    pixelRatio: CappedPixelRatio(),
  }),
  fallback: CommonInformationScreenFallback,
});

commonInfoScreen.getScreenOptions = (): ScreenOptions => ({
  stackAnimation: 'slide_from_bottom',
});

export default commonInfoScreen;

const styleSheet = createStyleSheet(appearance => ({
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  icon: { width: 60, height: 60 },
  container: {
    rowGap: 10,
    alignItems: 'center',
    backgroundColor: appearance === 'dark' ? '#000' : '#fff',
    paddingBottom: 20,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fieldName: { minWidth: 100 },
  companyLogoDescription: {
    paddingLeft: 30,
    paddingVertical: 10,
  },
  logoField: {
    padding: 20,
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
  ...buildContactCardModalStyleSheet(appearance),
}));
