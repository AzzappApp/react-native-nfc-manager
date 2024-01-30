import { omit } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  HORIZONTAL_PHOTO_DEFAULT_VALUES,
  HORIZONTAL_PHOTO_STYLE_VALUES,
  MODULE_IMAGE_MAX_WIDTH,
} from '@azzapp/shared/cardModuleHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { CameraButton } from '#components/commonsButtons';
import { FILTERS, exportLayersToImage, isFilter } from '#components/gpu';
import ImagePicker, {
  EditImageStep,
  SelectImageStep,
} from '#components/ImagePicker';
import { useRouter } from '#components/NativeRouter';
import ScreenModal from '#components/ScreenModal';
import { getFileName } from '#helpers/fileHelpers';
import { downScaleImage } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import useEditorLayout from '#hooks/useEditorLayout';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
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
import type { HorizontalPhotoEditionScreen_module$key } from '#relayArtifacts/HorizontalPhotoEditionScreen_module.graphql';
import type { HorizontalPhotoEditionScreen_profile$key } from '#relayArtifacts/HorizontalPhotoEditionScreen_profile.graphql';
import type {
  HorizontalPhotoEditionScreenUpdateModuleMutation,
  SaveHorizontalPhotoModuleInput,
} from '#relayArtifacts/HorizontalPhotoEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';
import type { Observable } from 'relay-runtime';

export type HorizontalPhotoEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  profile: HorizontalPhotoEditionScreen_profile$key;
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
  profile: profileKey,
}: HorizontalPhotoEditionScreenProps) => {
  // #region Data retrieval
  const horizontalPhoto = useFragment(
    graphql`
      fragment HorizontalPhotoEditionScreen_module on CardModuleHorizontalPhoto
      @argumentDefinitions(
        pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
        screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
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

  const profile = useFragment(
    graphql`
      fragment HorizontalPhotoEditionScreen_profile on Profile {
        ...HorizontalPhotoBackgroundEditionPanel_profile
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
        webCard {
          id
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
          ...HorizontalPhotoBorderEditionPanel_webCard
        }
      }
    `,
    profileKey,
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
    cardStyle: profile?.webCard.cardStyle,
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
      profile.moduleBackgrounds.find(
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
          webCard {
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
  const intl = useIntl();

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

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
        target: 'module',
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
      setProgressIndicator(uploadProgress);
      try {
        const { public_id } = await uploadPromise;
        mediaId = encodeMediaId(public_id, 'image');
      } catch (error) {
        console.error(error);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Could not save your photo module, media upload failed',
            description:
              'Error toast message when saving a horizontal photo module failed because medias upload failed.',
          }),
        });
      }
    }

    const input: SaveHorizontalPhotoModuleInput = {
      webCardId: profile.webCard.id,
      moduleId: horizontalPhoto?.id,
      image: mediaId ?? value.image!.id,
      ...rest,
    };

    commit({
      variables: {
        input,
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
            defaultMessage: 'Could not save your photo module, try again later',
            description:
              'Error toast message when saving a horizontal photo module failed because of an unknown error.',
          }),
        });
      },
    });
  }, [
    canSave,
    value,
    profile.webCard.id,
    horizontalPhoto?.id,
    commit,
    intl,
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

  const onMediaSelected = async ({
    uri,
    width,
    height,
    editionParameters,
    filter,
  }: ImagePickerResult) => {
    const size = downScaleImage(width, height, MODULE_IMAGE_MAX_WIDTH);
    const exportUri = await exportLayersToImage({
      size,
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
    setShowImagePicker(false);
    onImageChange({
      uri: exportUri,
      width: size.width,
      height: size.height,
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
          colorPalette={profile?.webCard.cardColors}
          cardStyle={profile?.webCard.cardStyle}
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
                webCard={profile?.webCard ?? null}
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
                profile={profile}
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
      <HorizontalPhotoEditionBottomMenu
        currentTab={currentTab}
        onItemPress={onCurrentTabChange}
        style={[
          styles.tabsBar,
          { bottom: insetBottom, width: windowWidth - 20 },
        ]}
      />
      <ScreenModal visible={showImagePicker}>
        <ImagePicker
          kind="image"
          onFinished={onMediaSelected}
          onCancel={onImagePickerCancel}
          steps={steps}
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

const steps = [SelectImageStep, EditImageStep];

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
