import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  CAROUSEL_DEFAULT_VALUES,
  MODULE_IMAGE_MAX_WIDTH,
  CAROUSEL_STYLE_VALUES,
  MODULE_KIND_CAROUSEL,
} from '@azzapp/shared/cardModuleHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { FILTERS, exportLayersToImage, isFilter } from '#components/gpu';
import ImagePicker from '#components/ImagePicker';
import { useRouter } from '#components/NativeRouter';
import ScreenModal from '#components/ScreenModal';
import WebCardModulePreview from '#components/WebCardModulePreview';
import { getFileName } from '#helpers/fileHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import useEditorLayout from '#hooks/useEditorLayout';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import TabView from '#ui/TabView';
import UploadProgressModal from '#ui/UploadProgressModal';
import CarouselEditionBackgroundPanel from './CarouselEditionBackgroundPanel';
import CarouselEditionBorderPanel from './CarouselEditionBorderPanel';
import CarouselEditionBottomMenu from './CarouselEditionBottomMenu';
import CarouselEditionMarginPanel from './CarouselEditionMarginPanel';
import CarouselImagesEditionPanel from './CarouselImagesEditionPanel';
import CarouselPreview from './CarouselPreview';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { CarouselEditionScreen_module$key } from '@azzapp/relay/artifacts/CarouselEditionScreen_module.graphql';
import type { CarouselEditionScreen_viewer$key } from '@azzapp/relay/artifacts/CarouselEditionScreen_viewer.graphql';
import type { CarouselEditionScreenUpdateModuleMutation } from '@azzapp/relay/artifacts/CarouselEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';
import type { Observable } from 'relay-runtime';

export type CarouselEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  viewer: CarouselEditionScreen_viewer$key;
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
  viewer: viewerKey,
}: CarouselEditionScreenProps) => {
  // #region Data retrieval
  const carousel = useFragment(
    graphql`
      fragment CarouselEditionScreen_module on CardModuleCarousel
      @argumentDefinitions(
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
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

  const viewer = useFragment(
    graphql`
      fragment CarouselEditionScreen_viewer on Viewer {
        ...CarouselEditionBackgroundPanel_viewer

        profile {
          webCard {
            ...WebCardColorPicker_webCard
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
            ...CarouselEditionBorderPanel_webCard
          }
        }
        moduleBackgrounds {
          id
          resizeMode
          uri
        }
      }
    `,
    viewerKey,
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
      cardStyle: viewer.profile?.webCard.cardStyle,
      styleValuesMap: CAROUSEL_STYLE_VALUES,
      defaultValues: CAROUSEL_DEFAULT_VALUES,
    });

  const {
    images,
    squareRatio,
    borderWidth,
    borderColor,
    borderRadius,
    imageHeight,
    marginHorizontal,
    marginVertical,
    gap,
    backgroundId,
    backgroundStyle,
  } = data;

  const previewData = {
    ...data,
    background:
      viewer.moduleBackgrounds.find(
        background => background.id === backgroundId,
      ) ?? null,
  };

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<CarouselEditionScreenUpdateModuleMutation>(graphql`
      mutation CarouselEditionScreenUpdateModuleMutation(
        $input: SaveCarouselModuleInput!
      ) {
        saveCarouselModule(input: $input) {
          webCard {
            id
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
  const canSave = dirty && isValid && !saving;

  const router = useRouter();
  const intl = useIntl();
  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const onSave = useCallback(async () => {
    if (!canSave) {
      return;
    }
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
          combineLatest(uploads.map(({ progress }) => progress)).map(
            progresses =>
              progresses.reduce((a, b) => a + b, 0) / progresses.length,
          ),
        );

        const medias = await Promise.all(
          uploads.map(({ promise, uri }) =>
            promise.then(uploadResult => ({
              id: encodeMediaId(uploadResult.public_id as string, 'image'),
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
        input: {
          images: images!.map(image => {
            if ('local' in image) {
              return mediasMap[image.uri].id;
            }
            return image.id;
          }),
          moduleId: carousel?.id,
          ...rest,
        },
      },
      onCompleted() {
        setShowImagePicker(false);
        router.back();
      },
      onError(e) {
        console.error(e);
        setShowImagePicker(false);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Could not save your carouse module, an error occured',
            description:
              'Error toast message when saving a carousel module failed for an unknown reason.',
          }),
        });
      },
    });
  }, [
    canSave,
    setProgressIndicator,
    value,
    commit,
    carousel?.id,
    intl,
    router,
  ]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);
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

      updateFields({
        images: [
          ...images,
          {
            local: true,
            id: localPath,
            uri: `file://${localPath.replace('file://', '')}`,
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

  const onBorderSizeChange = fieldUpdateHandler('borderWidth');

  const onBorderColorChange = fieldUpdateHandler('borderColor');

  const onBorderRadiusChange = fieldUpdateHandler('borderRadius');

  const onImageHeightChange = fieldUpdateHandler('imageHeight');

  const onMarginVerticalChange = fieldUpdateHandler('marginVertical');

  const onMarginHorizontalChange = fieldUpdateHandler('marginHorizontal');

  const onGapChange = fieldUpdateHandler('gap');

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

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
        middleElement={intl.formatMessage({
          defaultMessage: 'Image carousel',
          description: 'Image carousel screen title',
        })}
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
        height={topPanelHeight - 40}
        style={{ height: topPanelHeight - 40, marginVertical: 20 }}
        colorPalette={viewer.profile?.webCard.cardColors}
        cardStyle={viewer.profile?.webCard.cardStyle}
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
                onImageHeightChange={onImageHeightChange}
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
                webCard={viewer.profile?.webCard ?? null}
                borderWidth={borderWidth}
                borderColor={borderColor}
                borderRadius={borderRadius}
                bottomSheetHeight={bottomPanelHeight}
                onBorderSizeChange={onBorderSizeChange}
                onBorderColorChange={onBorderColorChange}
                onBorderRadiusChange={onBorderRadiusChange}
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
                onMarginVerticalChange={onMarginVerticalChange}
                onMarginHorizontalChange={onMarginHorizontalChange}
                onGapChange={onGapChange}
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
                viewer={viewer}
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
      <View
        style={{
          position: 'absolute',
          top: HEADER_HEIGHT + insetTop,
          height: topPanelHeight + bottomPanelHeight,
          width: windowWidth,
          opacity: currentTab === 'preview' ? 1 : 0,
        }}
        pointerEvents={currentTab === 'preview' ? 'auto' : 'none'}
      >
        <Suspense>
          <WebCardModulePreview
            editedModuleId={carousel?.id}
            visible={currentTab === 'preview'}
            editedModuleInfo={{
              kind: MODULE_KIND_CAROUSEL,
              data: previewData,
            }}
            height={topPanelHeight + bottomPanelHeight}
            contentPaddingBottom={insetBottom + BOTTOM_MENU_HEIGHT}
          />
        </Suspense>
      </View>
      <CarouselEditionBottomMenu
        currentTab={currentTab}
        onItemPress={setCurrentTab}
        style={[
          styles.tabsBar,
          { bottom: insetBottom, width: windowWidth - 20 },
        ]}
      />
      <ScreenModal visible={showImagePicker}>
        <ImagePicker
          kind="image"
          onFinished={onImagePickerFinished}
          onCancel={onCloseImagePicker}
        />
      </ScreenModal>

      <ScreenModal visible={!!progressIndicator}>
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
