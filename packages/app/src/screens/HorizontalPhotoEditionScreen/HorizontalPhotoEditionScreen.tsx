import { omit } from 'lodash';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Modal, StyleSheet, View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  HORIZONTAL_PHOTO_DEFAULT_VALUES,
  HORIZONTAL_PHOTO_STYLE_VALUES,
  MODULE_KIND_HORIZONTAL_PHOTO,
} from '@azzapp/shared/cardModuleHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { CameraButton } from '#components/commonsButtons';
import ImagePicker, {
  EditImageStep,
  SelectImageStep,
} from '#components/ImagePicker';
import { useRouter } from '#components/NativeRouter';
import WebCardModulePreview from '#components/WebCardModulePreview';
import { getFileName } from '#helpers/fileHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import { GraphQLError } from '#helpers/relayEnvironment';
import useEditorLayout from '#hooks/useEditorLayout';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
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
        imageHeight
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
        profile {
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
      }
    `,
    viewerKey,
  );

  // #endregion

  // #region Data edition
  const initialValue = useMemo(() => {
    return {
      borderWidth: horizontalPhoto?.borderWidth ?? null,
      borderRadius: horizontalPhoto?.borderRadius ?? null,
      borderColor: horizontalPhoto?.borderColor ?? null,
      marginHorizontal: horizontalPhoto?.marginHorizontal ?? null,
      marginVertical: horizontalPhoto?.marginVertical ?? null,
      imageHeight: horizontalPhoto?.imageHeight ?? null,
      backgroundId: horizontalPhoto?.background?.id ?? null,
      backgroundStyle: horizontalPhoto?.backgroundStyle ?? null,
      image: horizontalPhoto?.image ?? null,
    };
  }, [horizontalPhoto]);

  const { data, value, fieldUpdateHandler, dirty } = useModuleDataEditor({
    initialValue,
    cardStyle: viewer.profile?.cardStyle,
    styleValuesMap: HORIZONTAL_PHOTO_STYLE_VALUES,
    defaultValues: HORIZONTAL_PHOTO_DEFAULT_VALUES,
  });

  const {
    borderWidth,
    borderRadius,
    borderColor,
    marginHorizontal,
    marginVertical,
    imageHeight,
    backgroundId,
    backgroundStyle,
    image,
  } = data;

  const previewData = {
    ...omit(data, 'backgroundId'),
    background:
      viewer.moduleBackgrounds.find(
        background => background.id === backgroundId,
      ) ?? null,
  };
  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<HorizontalPhotoEditionScreenUpdateModuleMutation>(graphql`
      mutation HorizontalPhotoEditionScreenUpdateModuleMutation(
        $input: SaveHorizontalPhotoModuleInput!
      ) {
        saveHorizontalPhotoModule(input: $input) {
          profile {
            id
            cardModules {
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
    const { image: updateMedia, ...rest } = value;

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
        mediaId = encodeMediaId(public_id, 'image');
      } catch (error) {
        console.log(error);
      } finally {
        setUploadProgress(null); //force to null to avoid a blink effect on uploadProgressModal
      }
    }

    const input: SaveHorizontalPhotoModuleInput = {
      moduleId: horizontalPhoto?.id,
      image: mediaId ?? value.image!.id,
      ...rest,
    };

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
  }, [canSave, value, horizontalPhoto?.id, commit, router]);

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

  const onHeightChange = fieldUpdateHandler('imageHeight');

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

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
          data={previewData}
          colorPalette={viewer.profile?.cardColors}
          cardStyle={viewer.profile?.cardStyle}
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
                height={imageHeight}
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
                backgroundId={backgroundId}
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
            editedModuleId={horizontalPhoto?.id}
            visible={currentTab === 'preview'}
            editedModuleInfo={{
              kind: MODULE_KIND_HORIZONTAL_PHOTO,
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
