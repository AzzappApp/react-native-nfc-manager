import { ImageFormat } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useController } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { Pressable, ScrollView, View } from 'react-native';
import { useMutation, graphql } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { colors } from '#theme';
import ImagePicker, {
  SelectImageStep,
  type ImagePickerResult,
} from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { saveTransformedImageToFile } from '#helpers/mediaEditions';
import useBoolean from '#hooks/useBoolean';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import type {
  ContactCardEditCompanyLogoMutation,
  ContactCardEditCompanyLogoMutation$data,
} from '#relayArtifacts/ContactCardEditCompanyLogoMutation.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Control } from 'react-hook-form';
import type { ViewProps } from 'react-native';

const ContactCardEditCompanyLogo = ({
  control,
  canEditLogo = true,
  isPremium,
  company,
}: {
  control: Control<any>;
  isPremium?: boolean | null;
  canEditLogo?: boolean;
  company?: string | null;
}) => {
  const styles = useStyleSheet(stylesheet);

  const { field: fieldCompany } = useController({
    control,
    name: 'company',
  });

  const { field } = useController({
    control,
    name: 'logo',
  });

  const [commit] = useMutation<ContactCardEditCompanyLogoMutation>(graphql`
    mutation ContactCardEditCompanyLogoMutation($brand: String!) {
      extractCompanyLogo(brand: $brand) {
        id
        score
        uri
      }
    }
  `);

  const [searchCompany] = useDebounce(company || fieldCompany.value, 500);

  const [logos, setLogos] = useState<
    ContactCardEditCompanyLogoMutation$data['extractCompanyLogo']
  >([]);

  useEffect(() => {
    if (canEditLogo && searchCompany) {
      commit({
        variables: { brand: searchCompany },
        onCompleted: data => {
          setLogos(data.extractCompanyLogo);
        },
        onError: () => {},
      });
    } else {
      setLogos(null);
    }
  }, [canEditLogo, commit, searchCompany]);
  const [showImagePicker, openImagePicker, closeImagePicker] =
    useBoolean(false);

  const [pickerImage, setPickerImage] = useState<{
    id: string;
    uri: string;
    width: number;
    height: number;
  } | null>(field.value);

  const onImagePickerFinished = useCallback(
    async ({ id, uri, width, height }: ImagePickerResult) => {
      const { uri: localPath } = await manipulateAsync(uri, [], {
        format: SaveFormat.JPEG,
        compress: 1,
      });

      setPickerImage({
        id,
        uri: localPath,
        width,
        height,
      });
      field.onChange({
        local: true,
        id,
        uri: localPath,
        width,
        height,
      });
      imageLocalUrl.set(id, localPath);
      closeImagePicker();
    },
    [closeImagePicker, field],
  );

  const onSelectFetchedLogo = useCallback(
    async ({
      id,
      uri,
      width,
      height,
    }: {
      uri: string;
      id: string;
      height: number;
      width: number;
    }) => {
      let localPath = imageLocalUrl.get(id);
      const exportWidth = width;
      const exportHeight = height;
      if (!localPath) {
        localPath = await saveTransformedImageToFile({
          uri,
          resolution: { width: exportWidth, height: exportHeight },
          format: ImageFormat.PNG,
          quality: 95,
        });
        imageLocalUrl.set(id, localPath);
      }
      field.onChange({
        local: true,
        id,
        uri: localPath,
        width: exportWidth,
        height: exportHeight,
      });
    },
    [field],
  );

  if (!canEditLogo) {
    return (
      <>
        <View style={styles.logoField}>
          <View style={styles.logoButtonContainer}>
            <View style={styles.logoButton}>
              <Icon icon="locked" />
              <Text variant="smallbold">
                <FormattedMessage
                  defaultMessage="Logo"
                  description="Logo field registered for the contact card"
                />
              </Text>
            </View>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={{ uri: field.value?.uri }}
                  style={styles.logo}
                  contentFit="contain"
                />
              </View>
            </View>
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
      </>
    );
  }
  return (
    <Controller
      control={control}
      name="logo"
      render={({ field: { onChange, value } }) => {
        return (
          <>
            <View style={[styles.field, styles.container]}>
              <View style={styles.titleContainer}>
                <Text variant="smallbold" style={styles.fieldTitle}>
                  <FormattedMessage
                    defaultMessage="Company’s logo"
                    description="ContactCardCreationScreen - Company Logo"
                  />
                </Text>
                <PremiumIndicator
                  isRequired={!isPremium}
                  color={value ? undefined : colors.grey100}
                />
              </View>
              <Text variant="smallbold" style={styles.descriptionText}>
                <FormattedMessage
                  defaultMessage="We search for logos based on the information provided. Please select the logo you’d like to use for your company."
                  description="ContactCardCreationScreen - Compoany Logo explanation"
                />
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContentContainerStyle}
              style={styles.scrollView}
            >
              <Pressable
                style={styles.boxItem}
                onPress={openImagePicker}
                testID="companylogo_add_logo"
              >
                <Icon icon="add_filled" style={styles.addButton} />
              </Pressable>
              <Pressable
                style={[styles.boxItem, value?.uri == null && styles.selected]}
                onPress={() => onChange(null)}
                testID="companylogo_remove_logo"
              >
                <Text style={styles.noneText}>
                  <FormattedMessage
                    defaultMessage="None"
                    description="ContactCardEditCompanyLogo - None Logo Label"
                  />
                </Text>
              </Pressable>
              {pickerImage && (
                <LogoComponentItem
                  key={pickerImage.uri}
                  testID="companylogo_picker_logo_manual"
                  item={{
                    id: pickerImage.id,
                    uri: pickerImage.uri,
                    score: 100,
                  }}
                  selected={value?.id === pickerImage.id}
                  onSelect={onSelectFetchedLogo}
                  width={pickerImage.width}
                  height={pickerImage.height}
                />
              )}
              {logos?.map(logo => {
                if (logo) {
                  return (
                    <LogoComponentItem
                      key={logo.id}
                      item={logo}
                      selected={value?.id === logo.id}
                      onSelect={onSelectFetchedLogo}
                      width={1280} //size requested in request api
                      height={1280}
                      testID={`logoItem-${logo.id}`}
                    />
                  );
                }
                return null;
              })}
            </ScrollView>
            <ScreenModal
              visible={showImagePicker}
              onRequestDismiss={closeImagePicker}
            >
              <ImagePicker
                onFinished={onImagePickerFinished}
                onCancel={closeImagePicker}
                steps={[SelectImageStep]}
                kind="image"
              />
            </ScreenModal>
          </>
        );
      }}
    />
  );
};

const LogoComponentItem = ({
  item,
  selected,
  onSelect,
  width,
  height,
  testID,
}: Pick<ViewProps, 'testID'> & {
  item: FetchedLogo;
  width: number;
  height: number;
  selected: boolean;
  onSelect: (logo: {
    uri: string;
    id: string;
    height: number;
    width: number;
  }) => void;
}) => {
  const styles = useStyleSheet(stylesheet);

  const onPress = useCallback(() => {
    if (item) onSelect({ uri: item.uri, id: item.id, width, height });
  }, [height, item, onSelect, width]);

  if (!item) {
    return null;
  }

  return (
    <Pressable
      style={[
        styles.boxItem,
        width && height
          ? { aspectRatio: width / height }
          : styles.fallbackWidth,
        selected && styles.selected,
      ]}
      onPress={onPress}
      testID={testID}
    >
      <Image
        //use cache over uri to reduce request count to brandfetch external service
        source={{ uri: imageLocalUrl.get(item.id) ?? item.uri }}
        style={[
          styles.itemImage,
          width && height
            ? { aspectRatio: width / height }
            : styles.fallbackWidth,
        ]}
        contentFit="contain"
      />
    </Pressable>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  ...buildContactStyleSheet(appearance),
  boxItem: {
    borderWidth: 1,
    borderColor: colors.grey50,
    aspectRatio: 1,
    height: 55,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallbackWidth: { width: 55 },
  descriptionText: {
    marginBottom: 15,
    marginTop: 15,
    color: appearance === 'light' ? colors.grey500 : colors.grey500, //use same color dark as not defined
  },
  noneText: {
    color: appearance === 'light' ? colors.grey300 : colors.grey700,
  },
  selected: {
    borderWidth: 3,
    height: 55,
    borderColor: appearance === 'light' ? colors.black : colors.white,
  },
  itemImage: { flex: 1, height: 55 },
  container: {
    paddingTop: 20,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  scrollView: { marginBottom: 17 },
  scrollViewContentContainerStyle: {
    gap: 10,
    height: 61,
    alignItems: 'center',
    paddingLeft: 10,
  },
  addButton: { tintColor: colors.green },
  noneEditableLogo: {
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoField: {
    padding: 10,
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
  companyLogoDescription: {
    paddingLeft: 30,
    paddingVertical: 10,
  },
  logoButtonContainer: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    height: 55,
    width: 55,
  },
}));

const imageLocalUrl = new Map<string, string>();

export default ContactCardEditCompanyLogo;

type FetchedLogo = ArrayItemType<
  ContactCardEditCompanyLogoMutation$data['extractCompanyLogo']
>;
