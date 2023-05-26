import { GraphQLError } from 'graphql';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Modal, StyleSheet } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  CAROUSEL_DEFAULT_VALUES,
  CAROUSEL_IMAGE_MAX_WIDTH,
} from '@azzapp/shared/cardModuleHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { useRouter, useWebAPI } from '#PlatformEnvironment';
import { colors } from '#theme';
import { exportImage } from '#components/gpu';
import ImagePicker from '#components/ImagePicker';
import { getFileName } from '#helpers/fileHelpers';
import useDataEditor from '#hooks/useDataEditor';
import useEditorLayout from '#hooks/useEditorLayout';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
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
        borderSize
        borderColor
        borderRadius
        imageHeight
        marginHorizontal
        marginVertical
        gap
        background {
          id
          uri
        }
        backgroundStyle {
          backgroundColor
          patternColor
          opacity
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
          ...ProfileColorPicker_profile
        }
        moduleBackgrounds {
          id
          uri
        }
      }
    `,
    viewerKey,
  );
  // #endregion

  // #region Data edition
  const {
    data: {
      images,
      squareRatio,
      borderSize,
      borderColor,
      borderRadius,
      imageHeight,
      marginVertical,
      marginHorizontal,
      gap,
      background,
      backgroundStyle,
    },
    updates,
    dirty,
    updateFields,
    fieldUpdateHandler,
  } = useDataEditor<CarouseEditionValue>({
    initialValue: carousel,
    defaultValue: { ...CAROUSEL_DEFAULT_VALUES, images: [] },
  });

  const [saving, setSaving] = useState(false);
  // #region Mutations and saving logic
  const [commit] =
    useMutation<CarouselEditionScreenUpdateModuleMutation>(graphql`
      mutation CarouselEditionScreenUpdateModuleMutation(
        $input: SaveCarouselModuleInput!
      ) {
        saveCarouselModule(input: $input) {
          card {
            id
            modules {
              kind
              ...CarouselEditionScreen_module
            }
          }
        }
      }
    `);

  const isValid = images.length > 0;
  const canSave = dirty && isValid && !saving;

  const router = useRouter();
  const { uploadMedia, uploadSign } = useWebAPI();
  const [uploadProgress, setUploadProgress] =
    useState<Observable<number> | null>(null);

  const onSave = useCallback(async () => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    const { background, images, ...rest } = updates;

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
            id: uploadResult.public_id as string,
            width: uploadResult.width as number,
            height: uploadResult.height as number,
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
          images: images?.map(image => {
            if ('local' in image) {
              return mediasMap[image.uri].id;
            }
            return image.id;
          }),
          moduleId: carousel?.id,
          backgroundId: background == null ? null : background.id,
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
  }, [canSave, updates, commit, carousel?.id, uploadSign, uploadMedia, router]);

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
            uri: `file://${localPath}`,
            width: exportWidth,
            height: exportHeight,
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

  const onBorderSizeChange = fieldUpdateHandler('borderSize');

  const onBorderColorChange = fieldUpdateHandler('borderColor');

  const onBorderRadiusChange = fieldUpdateHandler('borderRadius');

  const onImageHeightChange = fieldUpdateHandler('imageHeight');

  const onMarginVerticalChange = fieldUpdateHandler('marginVertical');

  const onMarginHorizontalChange = fieldUpdateHandler('marginHorizontal');

  const onGapChange = fieldUpdateHandler('gap');

  const onBackgroundChange = useCallback(
    (backgroundId: string | null) => {
      updateFields({
        background:
          backgroundId == null
            ? null
            : viewer.moduleBackgrounds.find(({ id }) => id === backgroundId),
      });
    },
    [updateFields, viewer.moduleBackgrounds],
  );

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

  // #endregion
  const previewData = useMemo(
    () => ({
      images: images.map(image =>
        'local' in image
          ? {
              id: image.uri,
              uri: image.uri,
              aspectRatio: image.width / image.height,
            }
          : image,
      ),
      squareRatio,
      borderSize,
      borderColor,
      borderRadius,
      marginVertical,
      marginHorizontal,
      imageHeight,
      gap,
      background,
      backgroundStyle,
    }),
    [
      background,
      backgroundStyle,
      borderColor,
      borderRadius,
      borderSize,
      gap,
      imageHeight,
      images,
      marginHorizontal,
      marginVertical,
      squareRatio,
    ],
  );

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
          defaultMessage: 'Photo carousel',
          description: 'Photo carousel screen title',
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
                profile={viewer.profile!}
                borderSize={borderSize}
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
                imageHeight={imageHeight}
                onMarginVerticalChange={onMarginVerticalChange}
                onMarginHorizontalChange={onMarginHorizontalChange}
                onGapChange={onGapChange}
                onImageHeightChange={onImageHeightChange}
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
                backgroundId={background?.id ?? null}
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
  carouselContainer: {
    flex: 1,
    shadowColor: colors.black,
    shadowOpacity: 0.42,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 17,
  },
  tabsBar: {
    position: 'absolute',
    left: 10,
    right: 10,
  },
});

export default CarouselEditionScreen;

type CarouseEditionValue = {
  images: ReadonlyArray<
    | {
        id: string;
        uri: string;
        aspectRatio: number;
      }
    | {
        local: true;
        uri: string;
        width: number;
        height: number;
      }
  >;
  squareRatio: boolean;
  borderSize: number;
  borderColor: string;
  borderRadius: number;
  imageHeight: number;
  marginVertical: number;
  marginHorizontal: number;
  gap: number;
  background: Readonly<{
    id: string;
    uri: string;
  }> | null;
  backgroundStyle: Readonly<{
    backgroundColor: string;
    patternColor: string;
    opacity: number;
  }> | null;
};
