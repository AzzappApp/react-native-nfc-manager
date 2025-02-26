import { startTransition, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { Observable } from 'relay-runtime';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  CAROUSEL_DEFAULT_VALUES,
  MODULE_IMAGE_MAX_WIDTH,
  CAROUSEL_STYLE_VALUES,
  getCarouselDefaultColors,
} from '@azzapp/shared/cardModuleHelpers';
import { combineMultiUploadProgresses } from '@azzapp/shared/networkHelpers';
import { changeModuleRequireSubscription } from '@azzapp/shared/subscriptionHelpers';
import AnimatedDataOverride from '#components/AnimatedDataOverride';
import ImagePicker from '#components/ImagePicker';
import {
  useRouter,
  ScreenModal,
  preventModalDismiss,
} from '#components/NativeRouter';
import { getFileName } from '#helpers/fileHelpers';
import {
  getTargetFormatFromPath,
  saveTransformedImageToFile,
} from '#helpers/mediaEditions';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import { downScaleImage } from '#helpers/resolutionHelpers';
import useEditorLayout from '#hooks/useEditorLayout';
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { BOTTOM_MENU_HEIGHT, BOTTOM_MENU_PADDING } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import ModuleEditionScreenTitle from '#ui/ModuleEditionScreenTitle';
import TabView from '#ui/TabView';
import UploadProgressModal from '#ui/UploadProgressModal';
import CarouselEditionBackgroundPanel from './CarouselEditionBackgroundPanel';
import CarouselEditionBorderPanel from './CarouselEditionBorderPanel';
import CarouselEditionBottomMenu from './CarouselEditionBottomMenu';
import CarouselEditionMarginPanel from './CarouselEditionMarginPanel';
import CarouselImagesEditionPanel from './CarouselImagesEditionPanel';
import CarouselPreview from './CarouselPreview';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { CarouselEditionScreen_module$key } from '#relayArtifacts/CarouselEditionScreen_module.graphql';
import type { CarouselEditionScreen_profile$key } from '#relayArtifacts/CarouselEditionScreen_profile.graphql';
import type { CarouselEditionScreenUpdateModuleMutation } from '#relayArtifacts/CarouselEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';

export type CarouselEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  profile: CarouselEditionScreen_profile$key;
  /**
   * the current module to edit, if null, a new module will be created
   */
  module: CarouselEditionScreen_module$key | null;
};

/**
 * A component that allows to create or update the Carousel Webcard module.
 */
const CarouselEditionScreen = ({
  module,
  profile: profileKey,
}: CarouselEditionScreenProps) => {
  // #region Data retrieval
  const carousel = useFragment(
    graphql`
      fragment CarouselEditionScreen_module on CardModuleCarousel
      @argumentDefinitions(
        screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
        pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
      ) {
        id
        images {
          id
          uri(width: $screenWidth, pixelRatio: $pixelRatio)
          aspectRatio
        }
        squareRatio
        borderWidth
        borderColor
        borderRadius
        imageHeight
        marginHorizontal
        marginVertical
        gap
        background {
          id
          uri
          resizeMode
        }
        backgroundStyle {
          backgroundColor
          patternColor
        }
      }
    `,
    module,
  );

  const profile = useFragment(
    graphql`
      fragment CarouselEditionScreen_profile on Profile {
        webCard {
          id
          cardIsPublished
          coverBackgroundColor
          isPremium
          cardColors {
            primary
            light
            dark
          }
          cardStyle {
            borderColor
            borderRadius
            borderWidth
            buttonColor
            buttonRadius
            fontFamily
            fontSize
            gap
            titleFontFamily
            titleFontSize
          }
          cardModules {
            id
          }
          ...WebCardColorPicker_webCard
          ...CarouselEditionBorderPanel_webCard
          ...ModuleEditionScreenTitle_webCard
        }
        moduleBackgrounds {
          id
          resizeMode
          uri
        }
        ...CarouselEditionBackgroundPanel_profile
      }
    `,
    profileKey,
  );
  // #endregion

  // #region Data edition
  const initialValue = useMemo(() => {
    return {
      images: (carousel?.images ?? []) as ReadonlyArray<{
        readonly aspectRatio: number;
        readonly id: string;
        readonly uri: string;
        local?: true;
      }>,
      squareRatio: carousel?.squareRatio ?? null,
      borderWidth: carousel?.borderWidth ?? null,
      borderColor: carousel?.borderColor ?? null,
      borderRadius: carousel?.borderRadius ?? null,
      imageHeight: carousel?.imageHeight ?? null,
      marginHorizontal: carousel?.marginHorizontal ?? null,
      marginVertical: carousel?.marginVertical ?? null,
      gap: carousel?.gap ?? null,
      backgroundId: carousel?.background?.id ?? null,
      backgroundStyle: carousel?.backgroundStyle ?? null,
      ...getCarouselDefaultColors(
        profile.webCard?.coverBackgroundColor,
        carousel,
      ),
    };
  }, [carousel, profile.webCard?.coverBackgroundColor]);

  const { data, value, updateFields, fieldUpdateHandler, dirty } =
    useModuleDataEditor({
      initialValue,
      cardStyle: profile?.webCard?.cardStyle,
      styleValuesMap: CAROUSEL_STYLE_VALUES,
      defaultValues: CAROUSEL_DEFAULT_VALUES,
    });

  const { images, squareRatio, borderColor, backgroundId, backgroundStyle } =
    data;

  const previewData = {
    ...data,
    background:
      profile.moduleBackgrounds.find(
        background => background.id === backgroundId,
      ) ?? null,
  };

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<CarouselEditionScreenUpdateModuleMutation>(graphql`
      mutation CarouselEditionScreenUpdateModuleMutation(
        $webCardId: ID!
        $input: SaveCarouselModuleInput!
      ) {
        saveCarouselModule(webCardId: $webCardId, input: $input) {
          webCard {
            id
            requiresSubscription
            cardModules {
              id
              kind
              visible
              variant
              ...CarouselEditionScreen_module
            }
          }
        }
      }
    `);

  const isValid = images.length > 0;

  const [touched, setTouched] = useState(false);

  const onTouched = useCallback(() => {
    setTouched(true);
  }, []);

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const canSave =
    (dirty || touched) && isValid && !saving && !progressIndicator;

  const router = useRouter();
  const intl = useIntl();

  const cardModulesCount =
    (profile.webCard?.cardModules.length ?? 0) + (carousel ? 0 : 1);

  const onCancel = router.back;

  const handleProfileActionError = useHandleProfileActionError(
    intl.formatMessage({
      defaultMessage: 'Could not save your carousel module, an error occured',
      description:
        'Error toast message when saving a carousel module failed for an unknown reason.',
    }) as string,
  );
  // #endregion

  // #region Fields edition handlers
  const [showImagePicker, setShowImagePicker] = useState(images.length === 0);
  const [currentTab, setCurrentTab] = useState('images');

  const onMenuItemPress = useCallback((tabId: string) => {
    startTransition(() => {
      setCurrentTab(tabId);
    });
  }, []);

  const onShowImagePicker = useCallback(() => {
    setShowImagePicker(true);
  }, []);

  const onCloseImagePicker = useCallback(() => {
    if (images.length === 0) {
      router.back();
    }
    setShowImagePicker(false);
  }, [images.length, router]);

  const onImagePickerFinished = useCallback(
    async ({
      uri,
      width,
      height,
      editionParameters,
      filter,
      aspectRatio,
    }: ImagePickerResult) => {
      const resolution = downScaleImage(width, height, MODULE_IMAGE_MAX_WIDTH);
      const localPath = await saveTransformedImageToFile({
        uri,
        resolution,
        format: getTargetFormatFromPath(uri),
        quality: 95,
        filter,
        editionParameters,
      });

      updateFields({
        images: [
          ...images,
          {
            local: true,
            id: localPath,
            uri: localPath,
            aspectRatio,
          },
        ],
      });
      setShowImagePicker(false);
    },
    [images, updateFields],
  );

  const onRemoveImage = useCallback(
    (index: number) => {
      updateFields({
        images: images.filter((_, i) => i !== index),
      });
    },
    [images, updateFields],
  );

  const onSquareRatioChange = fieldUpdateHandler('squareRatio');

  const borderWidth = useSharedValue(
    data.borderWidth ?? CAROUSEL_DEFAULT_VALUES.borderWidth,
  );

  const borderRadius = useSharedValue(
    data.borderRadius ?? CAROUSEL_DEFAULT_VALUES.borderRadius,
  );

  const imageHeight = useSharedValue(
    data.imageHeight ?? CAROUSEL_DEFAULT_VALUES.imageHeight,
  );

  const marginVertical = useSharedValue(
    data.marginVertical ?? CAROUSEL_DEFAULT_VALUES.marginVertical,
  );

  const marginHorizontal = useSharedValue(
    data.marginHorizontal ?? CAROUSEL_DEFAULT_VALUES.marginHorizontal,
  );

  const gap = useSharedValue(data.gap ?? null);

  const onBorderColorChange = fieldUpdateHandler('borderColor');

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

  const animatedData = useDerivedValue(() => ({
    borderRadius: borderRadius.value,
    borderWidth: borderWidth.value,
    marginVertical: marginVertical.value,
    marginHorizontal: marginHorizontal.value,
    imageHeight: imageHeight.value,
    gap: gap.value,
  }));

  const onSave = useCallback(async () => {
    if (!canSave || !profile.webCard?.id) {
      return;
    }

    const requireSubscription = changeModuleRequireSubscription(
      'carousel',
      cardModulesCount,
    );

    if (
      profile.webCard?.cardIsPublished &&
      requireSubscription &&
      !profile.webCard.isPremium
    ) {
      router.push({ route: 'USER_PAY_WALL' });
      return;
    }

    setProgressIndicator(Observable.from(0));

    const { images, ...rest } = value;

    let mediasMap: Record<
      string,
      { id: string; width: number; height: number }
    > = {};

    if (images?.length) {
      try {
        const imageToUploads = convertToNonNullArray(
          await Promise.all(
            images.map(async image => {
              if (!('local' in image)) {
                return null;
              }
              const uploadInfos = await uploadSign({
                kind: 'image',
                target: 'module',
              });
              return {
                uri: image.uri,
                ...uploadInfos,
              };
            }),
          ),
        );

        const uploads = imageToUploads.map(
          ({ uri, uploadURL, uploadParameters }) => ({
            uri,
            ...uploadMedia(
              {
                name: getFileName(uri),
                uri,
                type: 'image/jpeg',
              } as any,
              uploadURL,
              uploadParameters,
            ),
          }),
        );

        setProgressIndicator(
          combineMultiUploadProgresses(uploads.map(({ progress }) => progress)),
        );

        const medias = await Promise.all(
          uploads.map(({ promise, uri }) =>
            promise.then(uploadResult => ({
              id: uploadResult.public_id,
              uri,
            })),
          ),
        );

        mediasMap = medias.reduce(
          (acc, media) => ({ ...acc, [media.uri]: media }),
          {},
        );
      } catch (e) {
        console.error(e);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Could not save your carouse module, medias upload failed',
            description:
              'Error toast message when saving a carousel module failed because medias upload failed.',
          }),
        });
        setProgressIndicator(null);
        return;
      }
    }

    commit({
      variables: {
        webCardId: profile.webCard.id,
        input: {
          images: images!.map(image => {
            if ('local' in image) {
              return mediasMap[image.uri].id;
            }
            return image.id;
          }),
          moduleId: carousel?.id,
          ...rest,
          borderWidth: borderWidth.value,
          borderRadius: borderRadius.value,
          imageHeight: imageHeight.value,
          marginHorizontal: marginHorizontal.value,
          marginVertical: marginVertical.value,
          gap: gap.value,
        },
      },
      onCompleted() {
        setProgressIndicator(null);
        setShowImagePicker(false);
        if (module) {
          router.pop(1);
        } else {
          router.pop(2);
        }
      },
      onError(e) {
        setProgressIndicator(null);
        console.error(e);
        setShowImagePicker(false);
        handleProfileActionError(e);
      },
    });
  }, [
    canSave,
    profile.webCard?.id,
    profile.webCard?.cardIsPublished,
    profile.webCard?.isPremium,
    cardModulesCount,
    value,
    commit,
    carousel?.id,
    borderWidth,
    borderRadius,
    imageHeight,
    marginHorizontal,
    marginVertical,
    gap,
    router,
    intl,
    module,
    handleProfileActionError,
  ]);

  // #endregion
  const {
    bottomPanelHeight,
    topPanelHeight,
    insetBottom,
    insetTop,
    windowWidth,
  } = useEditorLayout();

  return (
    <Container style={[styles.root, { paddingTop: insetTop }]}>
      <Header
        middleElement={
          <ModuleEditionScreenTitle
            label={intl.formatMessage({
              defaultMessage: 'Image carousel',
              description: 'Image carousel screen title',
            })}
            kind="carousel"
            moduleCount={cardModulesCount}
            webCardKey={profile.webCard}
          />
        }
        leftElement={
          <HeaderButton
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Cancel button label in carousel edition screen',
            })}
          />
        }
        rightElement={
          <HeaderButton
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Save button label in carousel edition screen',
            })}
          />
        }
      />
      <AnimatedDataOverride data={previewData} animatedData={animatedData}>
        {data => (
          <CarouselPreview
            data={data}
            style={{ height: topPanelHeight - 40, marginVertical: 20 }}
            colorPalette={profile?.webCard?.cardColors}
            cardStyle={profile?.webCard?.cardStyle}
          />
        )}
      </AnimatedDataOverride>
      <TabView
        style={{ height: bottomPanelHeight }}
        currentTab={currentTab}
        tabs={[
          {
            id: 'images',
            element: (
              <CarouselImagesEditionPanel
                images={images}
                squareRatio={squareRatio}
                onAddImage={onShowImagePicker}
                onRemoveImage={onRemoveImage}
                onSquareRatioChange={onSquareRatioChange}
                imageHeight={imageHeight}
                onTouched={onTouched}
                style={styles.tabStyle}
              />
            ),
          },
          {
            id: 'border',
            element: (
              <CarouselEditionBorderPanel
                webCard={profile?.webCard ?? null}
                borderWidth={borderWidth}
                borderColor={borderColor}
                borderRadius={borderRadius}
                bottomSheetHeight={bottomPanelHeight}
                onBorderColorChange={onBorderColorChange}
                onTouched={onTouched}
                style={styles.tabStyle}
              />
            ),
          },
          {
            id: 'margins',
            element: (
              <CarouselEditionMarginPanel
                marginVertical={marginVertical}
                marginHorizontal={marginHorizontal}
                gap={gap}
                onTouched={onTouched}
                style={styles.tabStyle}
              />
            ),
          },
          {
            id: 'background',
            element: (
              <CarouselEditionBackgroundPanel
                profile={profile}
                backgroundId={backgroundId ?? null}
                backgroundStyle={backgroundStyle}
                onBackgroundChange={onBackgroundChange}
                onBackgroundStyleChange={onBackgroundStyleChange}
                bottomSheetHeight={bottomPanelHeight}
                style={styles.tabStyle}
              />
            ),
          },
        ]}
      />
      <View
        style={[styles.tabsBar, { bottom: insetBottom - BOTTOM_MENU_PADDING }]}
      >
        <CarouselEditionBottomMenu
          currentTab={currentTab}
          onItemPress={onMenuItemPress}
          style={{ width: windowWidth - 20 }}
        />
      </View>
      <ScreenModal
        visible={showImagePicker}
        onRequestDismiss={onCloseImagePicker}
      >
        <ImagePicker
          kind="image"
          onFinished={onImagePickerFinished}
          onCancel={onCloseImagePicker}
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
    </Container>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabsBar: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  tabStyle: {
    flex: 1,
    marginBottom: BOTTOM_MENU_HEIGHT,
  },
});

export default CarouselEditionScreen;
