import { omit } from 'lodash';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
  PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
  PHOTO_WITH_TEXT_AND_TITLE_TEXT_MAX_LENGTH,
} from '@azzapp/shared/cardModuleHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
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
import InnerModal from '#ui/InnerModal';
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
        contentFontFamily
        contentFontColor
        contentTextAlign
        contentFontSize
        contentVerticalSpacing
        content
        titleFontFamily
        titleFontColor
        titleTextAlign
        titleFontSize
        titleVerticalSpacing
        title
        imageMargin
        verticalArrangement
        horizontalArrangement
        gap
        borderRadius
        marginHorizontal
        marginVertical
        aspectRatio
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
      fragment PhotoWithTextAndTitleEditionScreen_viewer on Viewer {
        ...PhotoWithTextAndTitleBackgroundEditionPanel_viewer
        ...PhotoWithTextAndTitleSettingsEditionPanel_viewer
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
        profile {
          cardColors {
            primary
            dark
            light
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
      contentFontFamily: photoWithTextAndTitle?.contentFontFamily ?? null,
      contentFontColor: photoWithTextAndTitle?.contentFontColor ?? null,
      contentTextAlign: photoWithTextAndTitle?.contentTextAlign ?? null,
      contentFontSize: photoWithTextAndTitle?.contentFontSize ?? null,
      contentVerticalSpacing:
        photoWithTextAndTitle?.contentVerticalSpacing ?? null,
      content: photoWithTextAndTitle?.content ?? null,
      titleFontFamily: photoWithTextAndTitle?.titleFontFamily ?? null,
      titleFontColor: photoWithTextAndTitle?.titleFontColor ?? null,
      titleTextAlign: photoWithTextAndTitle?.titleTextAlign ?? null,
      titleFontSize: photoWithTextAndTitle?.titleFontSize ?? null,
      titleVerticalSpacing: photoWithTextAndTitle?.titleVerticalSpacing ?? null,
      title: photoWithTextAndTitle?.title ?? null,
      image: photoWithTextAndTitle?.image ?? null,
      imageMargin: photoWithTextAndTitle?.imageMargin ?? null,
      verticalArrangement: photoWithTextAndTitle?.verticalArrangement ?? null,
      horizontalArrangement:
        photoWithTextAndTitle?.horizontalArrangement ?? null,
      gap: photoWithTextAndTitle?.gap ?? null,
      borderRadius: photoWithTextAndTitle?.borderRadius ?? null,
      marginHorizontal: photoWithTextAndTitle?.marginHorizontal ?? null,
      marginVertical: photoWithTextAndTitle?.marginVertical ?? null,
      backgroundId: photoWithTextAndTitle?.background?.id ?? null,
      backgroundStyle: photoWithTextAndTitle?.backgroundStyle ?? null,
      aspectRatio: photoWithTextAndTitle?.aspectRatio ?? null,
    };
  }, [photoWithTextAndTitle]);

  const { data, value, fieldUpdateHandler, updateFields, dirty } =
    useModuleDataEditor({
      initialValue,
      cardStyle: viewer.profile?.cardStyle,
      styleValuesMap: PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
      defaultValues: PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
    });

  const {
    image,
    content,
    contentFontFamily,
    contentFontColor,
    contentTextAlign,
    contentVerticalSpacing,
    contentFontSize,
    title,
    titleFontFamily,
    titleFontColor,
    titleTextAlign,
    titleVerticalSpacing,
    titleFontSize,
    imageMargin,
    verticalArrangement,
    horizontalArrangement,
    gap,
    borderRadius,
    marginHorizontal,
    marginVertical,
    backgroundId,
    backgroundStyle,
    aspectRatio,
  } = data;

  const previewData = {
    ...omit(data, 'backgroundId'),
    background:
      viewer.moduleBackgrounds.find(
        background => background.id === backgroundId,
      ) ?? null,
  };
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<PhotoWithTextAndTitleEditionScreenUpdateModuleMutation>(graphql`
      mutation PhotoWithTextAndTitleEditionScreenUpdateModuleMutation(
        $input: SavePhotoWithTextAndTitleModuleInput!
      ) {
        savePhotoWithTextAndTitleModule(input: $input) {
          profile {
            id
            cardModules {
              kind
              visible
              ...PhotoWithTextAndTitleEditionScreen_module
            }
          }
        }
      }
    `);
  const isValid =
    (isNotFalsyString(title) || isNotFalsyString(content)) && image;
  const canSave = dirty && isValid && !saving;

  const router = useRouter();
  const intl = useIntl();

  const [uploadProgress, setUploadProgress] =
    useState<Observable<number> | null>(null);

  const onSave = useCallback(async () => {
    if (!canSave) {
      return;
    }
    const { image: updateImage, ...rest } = value;
    let mediaId = updateImage?.id;

    if (!mediaId && updateImage?.uri) {
      //we need to save the media first
      const { uploadURL, uploadParameters } = await uploadSign({
        kind: 'image',
        target: 'module',
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
        mediaId = encodeMediaId(public_id, 'image');
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Could not save your module, media upload failed, try again later',
            description:
              'Error toast message when saving a photo with text and title failed because of a media upload error.',
          }),
        });
      } finally {
        setUploadProgress(null); //force to null to avoid a blink effect on uploadProgressModal
      }
    }

    const input: SavePhotoWithTextAndTitleModuleInput = {
      moduleId: photoWithTextAndTitle?.id,
      ...rest,
      image: mediaId ?? value.image!.id,
    };
    if (value.title) {
      input.title = value.title;
    }
    if (value.content) {
      input.content = value.content;
    }

    commit({
      variables: {
        input,
      },
      onCompleted() {
        router.back();
      },
      onError(e) {
        console.log(e);
        if (e instanceof GraphQLError) {
          console.log(e.cause);
        }
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Could not save your line divider module, try again later',
            description:
              'Error toast message when saving a photo with text and title module failed because of an unknown error.',
          }),
        });
      },
    });
  }, [canSave, value, photoWithTextAndTitle?.id, commit, router, intl]);

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

  const onTitleFontFamilyChange = fieldUpdateHandler('titleFontFamily');

  const onTitleFontColorChange = fieldUpdateHandler('titleFontColor');

  const onTitleTextAlignChange = fieldUpdateHandler('titleTextAlign');

  const onTitleFontSizeChange = fieldUpdateHandler('titleFontSize');

  const onContentChange = fieldUpdateHandler('content');

  const onTitleVerticalSpacingChange = fieldUpdateHandler(
    'titleVerticalSpacing',
  );
  const onContentFontFamilyChange = fieldUpdateHandler('contentFontFamily');

  const onContentFontColorChange = fieldUpdateHandler('contentFontColor');

  const onContentTextAlignChange = fieldUpdateHandler('contentTextAlign');

  const onContentFontSizeChange = fieldUpdateHandler('contentFontSize');

  const onTitleChange = fieldUpdateHandler('title');

  const onContentVerticalSpacingChange = fieldUpdateHandler(
    'contentVerticalSpacing',
  );

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

  const onBorderRadiusChange = fieldUpdateHandler('borderRadius');

  const onMarginHorizontalChange = fieldUpdateHandler('marginHorizontal');

  const onMarginVerticalChange = fieldUpdateHandler('marginVertical');

  const onAspectRatioChange = fieldUpdateHandler('aspectRatio');

  const onGapChange = fieldUpdateHandler('gap');

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

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
          data={previewData}
          colorPalette={viewer.profile?.cardColors}
          cardStyle={viewer.profile?.cardStyle}
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
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
                bottomSheetHeight={bottomPanelHeight}
                titleFontFamily={titleFontFamily}
                onTitleFontFamilyChange={onTitleFontFamilyChange}
                titleFontColor={titleFontColor}
                onTitleFontColorChange={onTitleFontColorChange}
                titleTextAlign={titleTextAlign}
                onTitleTextAlignChange={onTitleTextAlignChange}
                titleFontSize={titleFontSize}
                onTitleFontSizeChange={onTitleFontSizeChange}
                titleVerticalSpacing={titleVerticalSpacing}
                onTitleVerticalSpacingChange={onTitleVerticalSpacingChange}
                contentFontFamily={contentFontFamily}
                onContentFontFamilyChange={onContentFontFamilyChange}
                contentFontColor={contentFontColor}
                onContentFontColorChange={onContentFontColorChange}
                contentTextAlign={contentTextAlign}
                onContentTextAlignChange={onContentTextAlignChange}
                contentFontSize={contentFontSize}
                onContentFontSizeChange={onContentFontSizeChange}
                contentVerticalSpacing={contentVerticalSpacing}
                onContentVerticalSpacingChange={onContentVerticalSpacingChange}
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
      <TextAreaModal
        visible={showContentModal}
        value={content ?? ''}
        placeholder={intl.formatMessage({
          defaultMessage: 'Enter text',
          description:
            'Placeholder for text area in simple text edition screen',
        })}
        maxLength={PHOTO_WITH_TEXT_AND_TITLE_TEXT_MAX_LENGTH}
        onClose={onCloseContentModal}
        onChangeText={onContentChange}
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
              value={title ?? ''}
              onChangeText={onTitleChange}
              maxLength={PHOTO_WITH_TEXT_AND_TITLE_TEXT_MAX_LENGTH}
              style={{ borderWidth: 0 }}
            />
            <Text
              variant="smallbold"
              style={[
                styles.counter,
                (title?.length ?? 0) >= 300 && {
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
          <WebCardModulePreview
            editedModuleId={photoWithTextAndTitle?.id}
            visible={currentTab === 'preview'}
            editedModuleInfo={{
              kind: MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
              data: previewData,
            }}
            height={topPanelHeight + bottomPanelHeight}
            contentPaddingBottom={insetBottom + BOTTOM_MENU_HEIGHT}
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
      <InnerModal visible={showImagePicker}>
        <ImagePicker
          kind="image"
          onFinished={onMediaSelected}
          onCancel={onImagePickerCancel}
          steps={[SelectImageStep, EditImageStep]}
        />
      </InnerModal>
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
