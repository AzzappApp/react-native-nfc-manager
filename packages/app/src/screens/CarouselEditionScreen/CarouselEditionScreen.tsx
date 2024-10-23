import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { Observable } from 'relay-runtime';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  CAROUSEL_DEFAULT_VALUES,
  MODULE_IMAGE_MAX_WIDTH,
  CAROUSEL_STYLE_VALUES,
  getCarouselDefaultValues,
} from '@azzapp/shared/cardModuleHelpers';
import { combineMultiUploadProgresses } from '@azzapp/shared/networkHelpers';
import { changeModuleRequireSubscription } from '@azzapp/shared/subscriptionHelpers';
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
import useEditorLayout from '#hooks/useEditorLayout';
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
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
    };
  }, [carousel]);

  const { data, value, updateFields, fieldUpdateHandler, dirty } =
    useModuleDataEditor({
      initialValue,
      cardStyle: profile?.webCard?.cardStyle,
      styleValuesMap: CAROUSEL_STYLE_VALUES,
      defaultValues: getCarouselDefaultValues(
        profile.webCard?.coverBackgroundColor,
      ),
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
              kind
              visible
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
      editionParameters,
      filter,
      aspectRatio,
    }: ImagePickerResult) => {
      const exportWidth = Math.min(MODULE_IMAGE_MAX_WIDTH, width);
      const exportHeight = exportWidth / aspectRatio;
      const localPath = await saveTransformedImageToFile({
        uri,
        resolution: { width: exportWidth, height: exportHeight },
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
            uri: localPath.startsWith('file')
              ? localPath
              : `file://${localPath}`,
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
        router.back();
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
    cardModulesCount,
    profile.webCard?.cardIsPublished,
    profile.webCard?.isPremium,
    profile.webCard?.id,
    value,
    commit,
    carousel?.id,
    borderWidth.value,
    borderRadius.value,
    imageHeight.value,
    marginHorizontal.value,
    marginVertical.value,
    gap.value,
    router,
    intl,
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
      <CarouselPreview
        data={previewData}
        animatedData={{
          borderRadius,
          borderWidth,
          marginVertical,
          marginHorizontal,
          imageHeight,
          gap,
        }}
        style={{ height: topPanelHeight - 40, marginVertical: 20 }}
        colorPalette={profile?.webCard?.cardColors}
        cardStyle={profile?.webCard?.cardStyle}
      />
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
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
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
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
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
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
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
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
              />
            ),
          },
        ]}
      />
      <CarouselEditionBottomMenu
        currentTab={currentTab}
        onItemPress={setCurrentTab}
        style={[
          styles.tabsBar,
          { bottom: insetBottom, width: windowWidth - 20 },
        ]}
      />
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
    left: 10,
    right: 10,
  },
});

export default CarouselEditionScreen;
