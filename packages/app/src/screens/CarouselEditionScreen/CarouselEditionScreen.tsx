import { GraphQLError } from 'graphql';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Modal, StyleSheet, View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  CAROUSEL_DEFAULT_VALUES,
  CAROUSEL_IMAGE_MAX_WIDTH,
  CAROUSEL_STYLE_VALUES,
  MODULE_KIND_CAROUSEL,
} from '@azzapp/shared/cardModuleHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { exportImage } from '#components/gpu';
import ImagePicker from '#components/ImagePicker';
import { useRouter } from '#components/NativeRouter';
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
        ...CarouselEditionBorderPanel_viewer
        profile {
          ...ProfileColorPicker_profile
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
      cardStyle: viewer.profile?.cardStyle,
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
  const [saving, setSaving] = useState(false);
  const [commit] = useMutation<CarouselEditionScreenUpdateModuleMutation>(
    graphql`
      mutation CarouselEditionScreenUpdateModuleMutation(
        $input: SaveCarouselModuleInput!
      ) {
        saveCarouselModule(input: $input) {
          profile {
            id
            cardModules {
              kind
              visible
              ...CarouselEditionScreen_module
            }
          }
        }
      }
    `,
  );

  const isValid = images.length > 0;
  const canSave = dirty && isValid && !saving;

  const router = useRouter();
  const [uploadProgress, setUploadProgress] =
    useState<Observable<number> | null>(null);

  const onSave = useCallback(async () => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    const { images, ...rest } = value;

    let mediasMap: Record<
      string,
      { id: string; width: number; height: number }
    > = {};
    if (images?.length) {
      const imageToUploads = convertToNonNullArray(
        await Promise.all(
          images.map(async image => {
            if (!('local' in image)) {
              return null;
            }
            const uploadInfos = await uploadSign({
              kind: 'image',
              target: 'cover',
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
              type: 'image/jpg',
            } as any,
            uploadURL,
            uploadParameters,
          ),
        }),
      );

      setUploadProgress(
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
      setUploadProgress(null);
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
        router.back();
      },
      onError(e) {
        // eslint-disable-next-line no-alert
        // TODO better error handling
        console.log(e);
        if (e instanceof GraphQLError) {
          console.log(e.cause);
        }
      },
    });
  }, [canSave, value, commit, carousel?.id, router]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);
  // #endregion

  // #region Fields edition handlers
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [currentTab, setCurrentTab] = useState('images');

  const onShowImagePicker = useCallback(() => {
    setShowImagePicker(true);
  }, []);

  const onCloseImagePicker = useCallback(() => {
    setShowImagePicker(false);
  }, []);

  const onImagePickerFinished = useCallback(
    async ({
      uri,
      width,
      height,
      editionParameters,
      filter,
    }: ImagePickerResult) => {
      const aspectRatio = width / height;
      const exportWidth = Math.min(CAROUSEL_IMAGE_MAX_WIDTH, width);
      const exportHeight = exportWidth / aspectRatio;
      const localPath = await exportImage({
        size: { width: exportWidth, height: exportHeight },
        quality: 0.9,
        layers: [
          {
            kind: 'image',
            uri,
            parameters: editionParameters,
            filters: filter ? [filter] : [],
          },
        ],
      });

      updateFields({
        images: [
          ...images,
          {
            local: true,
            id: localPath,
            uri: `file://${localPath}`,
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
  const intl = useIntl();

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
        colorPalette={viewer.profile?.cardColors}
        cardStyle={viewer.profile?.cardStyle}
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
                viewer={viewer}
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
            style={{
              flex: 1,
            }}
            contentContainerStyle={{
              paddingBottom: insetBottom + BOTTOM_MENU_HEIGHT,
            }}
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
      <Modal
        visible={showImagePicker}
        animationType="slide"
        onRequestClose={onCloseImagePicker}
      >
        <ImagePicker
          kind="image"
          onFinished={onImagePickerFinished}
          onCancel={onCloseImagePicker}
        />
      </Modal>
      <UploadProgressModal
        visible={!!uploadProgress}
        progressIndicator={uploadProgress}
      />
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
