import { Suspense, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { Modal, StyleSheet, View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  HORIZONTAL_PHOTO_DEFAULT_VALUES,
  MODULE_KIND_HORIZONTAL_PHOTO,
} from '@azzapp/shared/cardModuleHelpers';
import { GraphQLError } from '@azzapp/shared/createRelayEnvironment';
import ImagePicker, {
  EditImageStep,
  SelectImageStep,
} from '#components/ImagePicker';
import { useRouter } from '#components/NativeRouter';
import WebCardPreview from '#components/WebCardPreview';
import { getFileName } from '#helpers/fileHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import useDataEditor from '#hooks/useDataEditor';
import useEditorLayout from '#hooks/useEditorLayout';
import { CameraButton } from '#screens/CoverEditionScreen/CoverEditionScreensButtons';
import exportMedia from '#screens/PostCreationScreen/exportMedia';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import PressableOpacity from '#ui/PressableOpacity';
import TabView from '#ui/TabView';
import UploadProgressModal from '#ui/UploadProgressModal';
import HorizontalPhotoBackgroundEditionPanel from './HorizontalPhotoBackgroundEditionPanel';
import HorizontalPhotoBorderEditionPanel from './HorizontalPhotoBorderEditionPanel';
import HorizontalPhotoEditionBottomMenu from './HorizontalPhotoEditionBottomMenu';
import HorizontalPhotoMarginsEditionPanel from './HorizontalPhotoMarginsEditionPanel';
import HorizontalPhotoPreview from './HorizontalPhotoPreview';
import HorizontalPhotoSettingsEditionPanel from './HorizontalPhotoSettingsEditionPanel';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { HorizontalPhotoEditionScreen_module$key } from '@azzapp/relay/artifacts/HorizontalPhotoEditionScreen_module.graphql';
import type { HorizontalPhotoEditionScreen_viewer$key } from '@azzapp/relay/artifacts/HorizontalPhotoEditionScreen_viewer.graphql';
import type {
  HorizontalPhotoEditionScreenUpdateModuleMutation,
  SaveHorizontalPhotoModuleInput,
} from '@azzapp/relay/artifacts/HorizontalPhotoEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';
import type { Observable } from 'relay-runtime';

export type HorizontalPhotoEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  viewer: HorizontalPhotoEditionScreen_viewer$key;
  /**
   * the current module to edit, if null, a new module will be created
   */
  module: HorizontalPhotoEditionScreen_module$key | null;
};

/**
 * A component that allows to create or update the HorizontalPhoto Webcard module.
 */
const HorizontalPhotoEditionScreen = ({
  module,
  viewer: viewerKey,
}: HorizontalPhotoEditionScreenProps) => {
  // #region Data retrieval
  const horizontalPhoto = useFragment(
    graphql`
      fragment HorizontalPhotoEditionScreen_module on CardModuleHorizontalPhoto
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
      ) {
        id
        borderWidth
        borderRadius
        borderColor
        marginHorizontal
        marginVertical
        height
        background {
          id
          uri
          resizeMode
        }
        backgroundStyle {
          backgroundColor
          patternColor
        }
        image {
          id
          width
          height
          uri(width: $screenWidth, pixelRatio: $pixelRatio)
        }
      }
    `,
    module,
  );

  const viewer = useFragment(
    graphql`
      fragment HorizontalPhotoEditionScreen_viewer on Viewer {
        ...HorizontalPhotoBorderEditionPanel_viewer
        ...HorizontalPhotoBackgroundEditionPanel_viewer
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
      }
    `,
    viewerKey,
  );

  // #endregion

  // #region Data edition
  const { data, updates, updateFields, fieldUpdateHandler, dirty } =
    useDataEditor({
      initialValue: horizontalPhoto,
      defaultValue: HORIZONTAL_PHOTO_DEFAULT_VALUES,
    });

  const {
    borderWidth,
    borderRadius,
    borderColor,
    marginHorizontal,
    marginVertical,
    height,
    background,
    backgroundStyle,
    image,
  } = data;

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<HorizontalPhotoEditionScreenUpdateModuleMutation>(graphql`
      mutation HorizontalPhotoEditionScreenUpdateModuleMutation(
        $input: SaveHorizontalPhotoModuleInput!
      ) {
        saveHorizontalPhotoModule(input: $input) {
          card {
            id
            modules {
              kind
              visible
              ...HorizontalPhotoEditionScreen_module
            }
          }
        }
      }
    `);

  const isValid = image?.id ?? image?.uri;
  const canSave = dirty && isValid && !saving;

  const router = useRouter();

  const onSave = useCallback(async () => {
    if (!canSave) {
      return;
    }
    const {
      background: updateBackground,
      image: updateMedia,
      ...rest
    } = updates;

    let mediaId = updateMedia?.id;
    if (!mediaId && updateMedia?.uri) {
      //we need to save the media first
      const { uploadURL, uploadParameters } = await uploadSign({
        kind: 'image',
        target: 'cover',
      });
      const fileName = getFileName(updateMedia.uri);
      const file: any = {
        name: fileName,
        uri: `file://${updateMedia.uri}`,
        type: 'image/jpeg',
      };

      const { progress: uploadProgress, promise: uploadPromise } = uploadMedia(
        file,
        uploadURL,
        uploadParameters,
      );
      setUploadProgress(uploadProgress);
      try {
        const { public_id } = await uploadPromise;
        mediaId = public_id;
      } catch (error) {
        console.log(error);
      } finally {
        setUploadProgress(null); //force to null to avoid a blink effect on uploadProgressModal
      }
    }

    const input: SaveHorizontalPhotoModuleInput = {
      moduleId: horizontalPhoto?.id,
      image: mediaId ?? data.image.id,
      ...rest,
    };
    if (updateBackground?.id !== horizontalPhoto?.background?.id) {
      input.backgroundId = updateBackground?.id ?? null;
    }

    commit({
      variables: {
        input,
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
  }, [
    canSave,
    updates,
    horizontalPhoto?.id,
    horizontalPhoto?.background?.id,
    data?.image?.id,
    commit,
    router,
  ]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  // #endregion

  //#region Image Picker state

  const [showImagePicker, setShowImagePicker] = useState(image == null);

  const onPickImage = () => {
    setShowImagePicker(true);
  };

  const [uploadProgress, setUploadProgress] =
    useState<Observable<number> | null>(null);

  const onMediaSelected = async ({
    kind,
    uri,
    aspectRatio,
    editionParameters,
    filter,
  }: ImagePickerResult) => {
    const exportedMedia = await exportMedia({
      uri,
      kind,
      editionParameters,
      aspectRatio,
      filter,
    });
    setShowImagePicker(false);
    onImageChange({
      uri: exportedMedia.uri,
      width: exportedMedia.size.width,
      height: exportedMedia.size.height,
      kind: 'image',
    });
  };

  const onImagePickerCancel = () => {
    setShowImagePicker(false);
  };
  //#endregion

  // #region Fields edition handlers
  const onBorderwidthChange = fieldUpdateHandler('borderWidth');

  const onBorderradiusChange = fieldUpdateHandler('borderRadius');

  const onBordercolorChange = fieldUpdateHandler('borderColor');

  const onMarginhorizontalChange = fieldUpdateHandler('marginHorizontal');

  const onMarginverticalChange = fieldUpdateHandler('marginVertical');

  const onHeightChange = fieldUpdateHandler('height');

  const onBackgroundChange = useCallback(
    (backgroundId: string | null) => {
      updateFields({
        background:
          backgroundId == null
            ? null
            : viewer.moduleBackgrounds.find(
                ({ id }: { id: string }) => id === backgroundId,
              ),
      });
    },
    [updateFields, viewer.moduleBackgrounds],
  );

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

  const onImageChange = fieldUpdateHandler('image');

  // #endregion

  // #region tabs

  const [currentTab, setCurrentTab] = useState('settings');
  const onCurrentTabChange = useCallback(
    (currentTab: string) => {
      setCurrentTab(currentTab);
    },
    [setCurrentTab],
  );

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
          defaultMessage: 'Horizontal Image',
          description: 'HorizontalPhoto text screen title',
        })}
        leftElement={
          <HeaderButton
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description:
                'Cancel button label in Horizontal Photo module screen',
            })}
          />
        }
        rightElement={
          <HeaderButton
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description:
                'Save button label in Horizontal Photo module screen',
            })}
          />
        }
      />
      <PressableOpacity onPress={onPickImage}>
        <HorizontalPhotoPreview
          style={{ height: topPanelHeight - 110, marginVertical: 10 }}
          data={data}
        />
      </PressableOpacity>
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          height: 50,
          marginBottom: 10,
          marginTop: 20,
        }}
      >
        <CameraButton onPress={onPickImage} style={{ width: 50 }} />
      </View>
      <TabView
        style={{ height: bottomPanelHeight }}
        currentTab={currentTab}
        tabs={[
          {
            id: 'settings',
            element: (
              <HorizontalPhotoSettingsEditionPanel
                height={height}
                onHeightChange={onHeightChange}
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
              <HorizontalPhotoBorderEditionPanel
                borderWidth={borderWidth}
                onBorderWidthChange={onBorderwidthChange}
                borderRadius={borderRadius}
                onBorderRadiusChange={onBorderradiusChange}
                borderColor={borderColor}
                onBorderColorChange={onBordercolorChange}
                viewer={viewer}
                bottomSheetHeight={bottomPanelHeight}
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
              <HorizontalPhotoMarginsEditionPanel
                marginHorizontal={marginHorizontal}
                onMarginHorizontalChange={onMarginhorizontalChange}
                marginVertical={marginVertical}
                onMarginVerticalChange={onMarginverticalChange}
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
              <HorizontalPhotoBackgroundEditionPanel
                viewer={viewer}
                backgroundId={background?.id}
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
          <WebCardPreview
            editedModuleId={horizontalPhoto?.id}
            visible={currentTab === 'preview'}
            editedModuleInfo={{
              kind: MODULE_KIND_HORIZONTAL_PHOTO,
              data,
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
      <HorizontalPhotoEditionBottomMenu
        currentTab={currentTab}
        onItemPress={onCurrentTabChange}
        style={[
          styles.tabsBar,
          { bottom: insetBottom, width: windowWidth - 20 },
        ]}
      />
      <Modal
        visible={showImagePicker}
        animationType={image?.uri ? 'slide' : 'none'}
        onRequestClose={onImagePickerCancel}
      >
        <ImagePicker
          kind="image"
          onFinished={onMediaSelected}
          onCancel={onImagePickerCancel}
          steps={[SelectImageStep, EditImageStep]}
        />
      </Modal>
      <UploadProgressModal
        visible={!!uploadProgress}
        progressIndicator={uploadProgress}
      />
    </Container>
  );
};

export default HorizontalPhotoEditionScreen;

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
