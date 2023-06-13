import { Suspense, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, Modal, View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import { GraphQLError } from '@azzapp/shared/createRelayEnvironment';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
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
import exportMedia from '#screens/PostCreationScreen/exportMedia';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import PressableOpacity from '#ui/PressableOpacity';
import TabView from '#ui/TabView';
import Text from '#ui/Text';
import TextAreaModal from '#ui/TextAreaModal';
import TextInput from '#ui/TextInput';
import UploadProgressModal from '#ui/UploadProgressModal';
import PhotoWithTextAndTitleBackgroundEditionPanel from './PhotoWithTextAndTitleBackgroundEditionPanel';
import PhotoWithTextAndTitleEditionBottomMenu from './PhotoWithTextAndTitleEditionBottomMenu';
import PhotoWithTextAndTitleImageEditionPanel from './PhotoWithTextAndTitleImageEditionPanel';
import PhotoWithTextAndTitleMarginsEditionPanel from './PhotoWithTextAndTitleMarginsEditionPanel';
import PhotoWithTextAndTitlePreview from './PhotoWithTextAndTitlePreview';
import PhotoWithTextAndTitleSettingsEditionPanel from './PhotoWithTextAndTitleSettingsEditionPanel';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { PhotoWithTextAndTitleEditionScreen_module$key } from '@azzapp/relay/artifacts/PhotoWithTextAndTitleEditionScreen_module.graphql';
import type { PhotoWithTextAndTitleEditionScreen_viewer$key } from '@azzapp/relay/artifacts/PhotoWithTextAndTitleEditionScreen_viewer.graphql';
import type {
  PhotoWithTextAndTitleEditionScreenUpdateModuleMutation,
  SavePhotoWithTextAndTitleModuleInput,
} from '@azzapp/relay/artifacts/PhotoWithTextAndTitleEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';
import type { Observable } from 'relay-runtime';

export type PhotoWithTextAndTitleEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  viewer: PhotoWithTextAndTitleEditionScreen_viewer$key;
  /**
   * the current module to edit, if null, a new module will be created
   */
  module: PhotoWithTextAndTitleEditionScreen_module$key | null;
};

/**
 * A component that allows to create or update the PhotoWithTextAndTitle Webcard module.
 */
const PhotoWithTextAndTitleEditionScreen = ({
  module,
  viewer: viewerKey,
}: PhotoWithTextAndTitleEditionScreenProps) => {
  // #region Data retrieval
  const photoWithTextAndTitle = useFragment(
    graphql`
      fragment PhotoWithTextAndTitleEditionScreen_module on CardModulePhotoWithTextAndTitle
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
        image {
          id
          width
          height
          uri(width: $screenWidth, pixelRatio: $pixelRatio)
        }
        fontFamily
        fontColor
        textAlign
        imageMargin
        verticalArrangement
        horizontalArrangement
        gap
        fontSize
        textSize
        text
        title
        borderRadius
        marginHorizontal
        marginVertical
        aspectRatio
        verticalSpacing
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
      fragment PhotoWithTextAndTitleEditionScreen_viewer on Viewer {
        ...PhotoWithTextAndTitleBackgroundEditionPanel_viewer
        ...PhotoWithTextAndTitleSettingsEditionPanel_viewer
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
  const { data, updates, updateFields, fieldUpdateHandler, dirty } =
    useDataEditor({
      initialValue: photoWithTextAndTitle,
      defaultValue: PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
    });

  const {
    image,
    fontFamily,
    fontColor,
    textAlign,
    imageMargin,
    verticalArrangement,
    horizontalArrangement,
    gap,
    text,
    title,
    fontSize,
    textSize,
    borderRadius,
    marginHorizontal,
    marginVertical,
    background,
    backgroundStyle,
    verticalSpacing,
    aspectRatio,
  } = data;
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<PhotoWithTextAndTitleEditionScreenUpdateModuleMutation>(graphql`
      mutation PhotoWithTextAndTitleEditionScreenUpdateModuleMutation(
        $input: SavePhotoWithTextAndTitleModuleInput!
      ) {
        savePhotoWithTextAndTitleModule(input: $input) {
          card {
            id
            modules {
              kind
              ...PhotoWithTextAndTitleEditionScreen_module
            }
          }
        }
      }
    `);
  const isValid = isNotFalsyString(text) && isNotFalsyString(title) && image;
  const canSave = dirty && isValid && !saving;

  const router = useRouter();

  const [uploadProgress, setUploadProgress] =
    useState<Observable<number> | null>(null);

  const onSave = useCallback(async () => {
    if (!canSave) {
      return;
    }
    const {
      image: updateImage,
      background: updateBackground,
      ...rest
    } = updates;
    let mediaId = updateImage?.id;

    if (!mediaId && updateImage?.uri) {
      //we need to save the media first
      const { uploadURL, uploadParameters } = await uploadSign({
        kind: 'image',
        target: 'cover',
      });
      const fileName = getFileName(updateImage.uri);
      const file: any = {
        name: fileName,
        uri: `file://${updateImage.uri}`,
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
      }
    }

    const input: SavePhotoWithTextAndTitleModuleInput = {
      moduleId: photoWithTextAndTitle?.id,
      image: mediaId ?? data.image.id,
      ...rest,
    };

    if (updateBackground?.id !== photoWithTextAndTitle?.background?.id) {
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

        if (e instanceof GraphQLError) {
          console.log(e.cause);
        } else {
          console.log(e);
        }
      },
    });
  }, [
    canSave,
    updates,
    photoWithTextAndTitle?.id,
    photoWithTextAndTitle?.background?.id,
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

  const onImageChange = fieldUpdateHandler('image');

  const onTextChange = fieldUpdateHandler('text');

  const onTitleChange = fieldUpdateHandler('title');

  const onFontFamilyChange = fieldUpdateHandler('fontFamily');

  const onFontColorChange = fieldUpdateHandler('fontColor');

  const onTextAlignChange = fieldUpdateHandler('textAlign');

  const onImageMarginChange = useCallback(() => {
    updateFields({
      imageMargin:
        imageMargin === 'width_full' ? 'width_limited' : 'width_full',
    });
  }, [imageMargin, updateFields]);

  const onVerticalArrangementChange = useCallback(() => {
    updateFields({
      verticalArrangement: verticalArrangement === 'top' ? 'bottom' : 'top',
    });
  }, [verticalArrangement, updateFields]);

  const onHorizontalArrangementChange = useCallback(() => {
    updateFields({
      horizontalArrangement:
        horizontalArrangement === 'left' ? 'right' : 'left',
    });
  }, [horizontalArrangement, updateFields]);

  const onFontSizeChange = fieldUpdateHandler('fontSize');

  const onTextSizeChange = fieldUpdateHandler('textSize');

  const onBorderRadiusChange = fieldUpdateHandler('borderRadius');

  const onMarginHorizontalChange = fieldUpdateHandler('marginHorizontal');

  const onMarginVerticalChange = fieldUpdateHandler('marginVertical');

  const onVerticalSpacingChange = fieldUpdateHandler('verticalSpacing');

  const onAspectRatioChange = fieldUpdateHandler('aspectRatio');

  const onGapChange = fieldUpdateHandler('gap');

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

  // #endregion

  // #region tabs

  const [showContentModal, setShowContentModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('text');

  const onCloseContentModal = useCallback(() => {
    setShowContentModal(false);
  }, []);

  const onCurrentTabChange = useCallback(
    (currentTab: string) => {
      // TODO: Specific case for modal tab
      if (currentTab === 'editor') {
        setShowContentModal(true);
      } else {
        setCurrentTab(currentTab);
      }
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
          defaultMessage: 'Image & Text',
          description: 'PhotoWithTextAndTitle text screen title',
        })}
        leftElement={
          <HeaderButton
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description:
                'Cancel button label in Photo with text and title module screen',
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
                'Save button label in  Photo with text and title module screen',
            })}
          />
        }
      />
      <PressableOpacity onPress={onPickImage}>
        <PhotoWithTextAndTitlePreview
          style={{ height: topPanelHeight - 20, marginVertical: 10 }}
          data={data}
        />
      </PressableOpacity>
      <TabView
        style={{ height: bottomPanelHeight }}
        currentTab={currentTab}
        tabs={[
          {
            id: 'text',
            element: (
              <PhotoWithTextAndTitleSettingsEditionPanel
                viewer={viewer}
                fontFamily={fontFamily}
                onFontFamilyChange={onFontFamilyChange}
                fontColor={fontColor}
                onFontColorChange={onFontColorChange}
                textAlign={textAlign}
                onTextAlignChange={onTextAlignChange}
                fontSize={fontSize}
                onFontSizeChange={onFontSizeChange}
                textSize={textSize}
                onTextSizeChange={onTextSizeChange}
                verticalSpacing={verticalSpacing}
                onVerticalSpacingChange={onVerticalSpacingChange}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
                bottomSheetHeight={bottomPanelHeight}
              />
            ),
          },
          {
            id: 'image',
            element: (
              <PhotoWithTextAndTitleImageEditionPanel
                imageMargin={imageMargin}
                onImageMarginChange={onImageMarginChange}
                horizontalArrangement={horizontalArrangement}
                onHorizontalArrangementChange={onHorizontalArrangementChange}
                verticalArrangement={verticalArrangement}
                onVerticalArrangementChange={onVerticalArrangementChange}
                borderRadius={borderRadius}
                onBorderRadiusChange={onBorderRadiusChange}
                aspectRatio={aspectRatio}
                onAspectRatioChange={onAspectRatioChange}
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
              <PhotoWithTextAndTitleMarginsEditionPanel
                marginHorizontal={marginHorizontal}
                onMarginHorizontalChange={onMarginHorizontalChange}
                marginVertical={marginVertical}
                onMarginVerticalChange={onMarginVerticalChange}
                gap={gap}
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
              <PhotoWithTextAndTitleBackgroundEditionPanel
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
      <TextAreaModal
        visible={showContentModal}
        value={text}
        placeholder={intl.formatMessage({
          defaultMessage: 'Enter text',
          description:
            'Placeholder for text area in simple text edition screen',
        })}
        maxLength={2200}
        onClose={onCloseContentModal}
        onChangeText={onTextChange}
        closeOnBlur={false}
        ItemTopComponent={
          <>
            <TextInput
              multiline
              placeholder={intl.formatMessage({
                defaultMessage: 'Title',
                description:
                  'Title placeholder in PhotoWithTextAndTitle module',
              })}
              value={title}
              onChangeText={onTitleChange}
              maxLength={300}
              style={{ borderWidth: 0 }}
            />
            <Text
              variant="smallbold"
              style={[
                styles.counter,
                title.length >= 300 && {
                  color: colors.red400,
                },
              ]}
            >
              {title?.length ?? 0} / 300
            </Text>
          </>
        }
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
            editedModuleId={photoWithTextAndTitle?.id}
            visible={currentTab === 'preview'}
            editedModuleInfo={{
              kind: MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
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
      <PhotoWithTextAndTitleEditionBottomMenu
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

export default PhotoWithTextAndTitleEditionScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabsBar: {
    position: 'absolute',
    left: 10,
    right: 10,
  },
  counter: {
    marginTop: 5,
    marginBottom: 10,
    marginLeft: 12,
    color: 'white',
  },
});
