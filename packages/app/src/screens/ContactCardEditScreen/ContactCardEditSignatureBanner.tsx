import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { Controller, useController } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { Pressable, View } from 'react-native';
import { colors } from '#theme';
import ImagePicker, {
  SelectImageStep,
  type ImagePickerResult,
} from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useBoolean from '#hooks/useBoolean';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import type { Control } from 'react-hook-form';
import type { ViewProps } from 'react-native';

const ContactCardEditSignatureBanner = ({
  control,
  canEditBanner = true,
  isPremium,
}: {
  control: Control<any>;
  isPremium?: boolean | null;
  canEditBanner?: boolean;
}) => {
  const styles = useStyleSheet(stylesheet);

  const { field } = useController({
    control,
    name: 'banner',
  });

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
      setPickerImage({
        id,
        uri,
        width,
        height,
      });
      field.onChange({
        local: true,
        id,
        uri,
        width,
        height,
      });
      closeImagePicker();
    },
    [closeImagePicker, field],
  );

  const onSelectFetchedBanner = useCallback(
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
      field.onChange({
        local: true,
        id,
        uri,
        width,
        height,
      });
    },
    [field],
  );

  if (!canEditBanner) {
    return (
      <>
        <View style={styles.bannerField}>
          <View style={styles.bannerButtonContainer}>
            <View style={styles.bannerButton}>
              <Icon icon="locked" />
              <Text variant="smallbold">
                <FormattedMessage
                  defaultMessage="Signature's banner"
                  description="Banner field registered for the contact card"
                />
              </Text>
            </View>
            <View style={styles.bannerContainer}>
              <View style={styles.bannerLockedImage}>
                <Image
                  source={{ uri: field.value?.uri }}
                  style={[
                    styles.itemImage,
                    pickerImage?.width && pickerImage?.height
                      ? {
                          aspectRatio: pickerImage?.width / pickerImage?.height,
                        }
                      : styles.fallbackWidth,
                  ]}
                  contentFit="contain"
                />
              </View>
            </View>
          </View>
        </View>
      </>
    );
  }
  return (
    <Controller
      control={control}
      name="banner"
      render={({ field: { onChange, value } }) => {
        return (
          <>
            <View style={[styles.field, styles.container]}>
              <View style={styles.titleContainer}>
                <Text variant="smallbold" style={styles.fieldTitle}>
                  <FormattedMessage
                    defaultMessage="Email signature’s banner"
                    description="ContactCardCreationScreen - Signature Banner"
                  />
                </Text>
                <PremiumIndicator
                  isRequired={!isPremium}
                  color={value ? undefined : colors.grey100}
                />
              </View>
            </View>
            <View style={styles.selectContainer}>
              <Pressable style={styles.boxItem} onPress={openImagePicker}>
                <Icon icon="add_filled" style={styles.addButton} />
              </Pressable>
              <Pressable
                style={[styles.boxItem, value?.uri == null && styles.selected]}
                onPress={() => onChange(null)}
              >
                <Text style={styles.noneText}>
                  <FormattedMessage
                    defaultMessage="None"
                    description="ContactCardEditSignatureBanner - None Banner Label"
                  />
                </Text>
              </Pressable>
              {pickerImage && (
                <BannerComponentItem
                  key={pickerImage.uri}
                  item={{
                    id: pickerImage.id,
                    uri: pickerImage.uri,
                    score: 100,
                  }}
                  selected={value?.id === pickerImage.id}
                  onSelect={onSelectFetchedBanner}
                  width={pickerImage.width}
                  height={pickerImage.height}
                />
              )}
            </View>
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

const BannerComponentItem = ({
  item,
  selected,
  onSelect,
  width,
  height,
  testID,
}: Pick<ViewProps, 'testID'> & {
  item: any;
  width: number;
  height: number;
  selected: boolean;
  onSelect: (banner: {
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
        { flex: 1, height: 55 },
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
        contentFit="cover"
      />
    </Pressable>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  ...buildContactStyleSheet(appearance),
  boxItem: {
    aspectRatio: 1,
    height: 59,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  fallbackWidth: {
    aspectRatio: 1,
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
    borderColor: appearance === 'light' ? colors.black : colors.white,
  },
  itemImage: {
    flex: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    width: '100%',
  },
  container: {
    paddingTop: 20,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  selectContainer: {
    marginBottom: 17,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 10,
    width: '100%',
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
  bannerField: {
    padding: 10,
    borderColor: colors.grey50,
    borderTopWidth: 1,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 7,
  },
  bannerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  bannerLockedImage: {
    flex: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.grey100,
    borderRadius: 5,
  },
  companyBannerDescription: {
    paddingLeft: 30,
    paddingVertical: 10,
  },
  bannerButtonContainer: { flexDirection: 'row', alignItems: 'center' },
}));

const imageLocalUrl = new Map<string, string>();

export default ContactCardEditSignatureBanner;
