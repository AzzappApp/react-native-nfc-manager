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
import type { ContactCardFormValues } from './ContactCardSchema';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Control } from 'react-hook-form';
import type { ViewProps } from 'react-native';

const ContactCardEditCompanyLogo = ({
  control,
}: {
  control: Control<ContactCardFormValues>;
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

  const [searchCompany] = useDebounce(fieldCompany.value, 500);

  const [logos, setLogos] = useState<
    ContactCardEditCompanyLogoMutation$data['extractCompanyLogo']
  >([]);

  useEffect(() => {
    if (searchCompany) {
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
  }, [commit, searchCompany]);
  const [showImagePicker, openImagePicker, closeImagePicker] =
    useBoolean(false);

  const [pickerImage, setPickerImage] = useState<{
    id: string;
    uri: string;
    width: number;
    height: number;
  } | null>(null);

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

  return (
    <Controller
      control={control}
      name="logo"
      render={({ field: { onChange, value } }) => {
        return (
          <>
            <View style={[styles.field, styles.container]}>
              <Text variant="smallbold" style={styles.fieldTitle}>
                <FormattedMessage
                  defaultMessage="Company’s logo"
                  description="ContactCardCreationScreen - Compoany Logo"
                />
              </Text>
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
        { aspectRatio: width / height },
        selected && styles.selected,
      ]}
      onPress={onPress}
      testID={testID}
    >
      <Image
        //use cache over uri to reduce request count to brandfetch external service
        source={{ uri: imageLocalUrl.get(item.id) ?? item.uri }}
        style={[styles.itemImage, { aspectRatio: width / height }]}
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
}));

const imageLocalUrl = new Map<string, string>();

export default ContactCardEditCompanyLogo;

type FetchedLogo = ArrayItemType<
  ContactCardEditCompanyLogoMutation$data['extractCompanyLogo']
>;
