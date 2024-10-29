import omit from 'lodash/omit';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Platform, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { Observable } from 'relay-runtime';
import {
  getPhotoWithTextAndTitleDefaultValues,
  MODULE_IMAGE_MAX_WIDTH,
  PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
  PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
  PHOTO_WITH_TEXT_AND_TITLE_TEXT_MAX_LENGTH,
} from '@azzapp/shared/cardModuleHelpers';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { changeModuleRequireSubscription } from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import ImagePicker, {
  EditImageStep,
  SelectImageStep,
} from '#components/ImagePicker';
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
import { downScaleImage } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import useEditorLayout from '#hooks/useEditorLayout';
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import ModuleEditionScreenTitle from '#ui/ModuleEditionScreenTitle';
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
import type { PhotoWithTextAndTitleEditionScreen_module$key } from '#relayArtifacts/PhotoWithTextAndTitleEditionScreen_module.graphql';
import type { PhotoWithTextAndTitleEditionScreen_profile$key } from '#relayArtifacts/PhotoWithTextAndTitleEditionScreen_profile.graphql';
import type {
  PhotoWithTextAndTitleEditionScreenUpdateModuleMutation,
  SavePhotoWithTextAndTitleModuleInput,
} from '#relayArtifacts/PhotoWithTextAndTitleEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';

export type PhotoWithTextAndTitleEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  profile: PhotoWithTextAndTitleEditionScreen_profile$key;
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
  profile: profileKey,
}: PhotoWithTextAndTitleEditionScreenProps) => {
  // #region Data retrieval
  const photoWithTextAndTitle = useFragment(
    graphql`
      fragment PhotoWithTextAndTitleEditionScreen_module on CardModulePhotoWithTextAndTitle
      @argumentDefinitions(
        pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
        screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
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

  const profile = useFragment(
    graphql`
      fragment PhotoWithTextAndTitleEditionScreen_profile on Profile {
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
        webCard {
          id
          cardIsPublished
          coverBackgroundColor
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
          cardModules {
            id
          }
          isPremium
          ...PhotoWithTextAndTitleSettingsEditionPanel_webCard
          ...ModuleEditionScreenTitle_webCard
        }
        ...PhotoWithTextAndTitleBackgroundEditionPanel_profile
      }
    `,
    profileKey,
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
      cardStyle: profile?.webCard?.cardStyle,
      styleValuesMap: PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
      defaultValues: getPhotoWithTextAndTitleDefaultValues(
        profile.webCard?.coverBackgroundColor,
      ),
    });

  const {
    image,
    content,
    contentFontFamily,
    contentFontColor,
    contentTextAlign,
    title,
    titleFontFamily,
    titleFontColor,
    titleTextAlign,
    imageMargin,
    verticalArrangement,
    horizontalArrangement,
    backgroundId,
    backgroundStyle,
  } = data;

  const previewData = {
    ...omit(data, 'backgroundId'),
    background:
      profile.moduleBackgrounds.find(
        background => background.id === backgroundId,
      ) ?? null,
  };
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<PhotoWithTextAndTitleEditionScreenUpdateModuleMutation>(graphql`
      mutation PhotoWithTextAndTitleEditionScreenUpdateModuleMutation(
        $webCardId: ID!
        $input: SavePhotoWithTextAndTitleModuleInput!
      ) {
        savePhotoWithTextAndTitleModule(webCardId: $webCardId, input: $input) {
          webCard {
            id
            requiresSubscription
            cardModules {
              kind
              visible
              ...PhotoWithTextAndTitleEditionScreen_module
            }
          }
        }
      }
    `);

  const [touched, setTouched] = useState(false);

  const onTouched = useCallback(() => {
    setTouched(true);
  }, []);

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const isValid =
    (isNotFalsyString(title) || isNotFalsyString(content)) && image;
  const canSave =
    (dirty || touched) && isValid && !saving && !progressIndicator;
  const router = useRouter();
  const intl = useIntl();

  const cardModulesCount =
    (profile.webCard?.cardModules.length ?? 0) +
    (photoWithTextAndTitle ? 0 : 1);

  const onCancel = router.back;

  const handleProfileActionError = useHandleProfileActionError(
    intl.formatMessage({
      defaultMessage:
        'Could not save your image with title module, try again later',
      description:
        'Error toast message when saving a photo with text and title module failed because of an unknown error.',
    }) as string,
  );
  // #endregion

  //#region Image Picker state

  const [showImagePicker, setShowImagePicker] = useState(image == null);

  const onPickImage = () => {
    setShowImagePicker(true);
  };

  const onMediaSelected = async ({
    uri,
    editionParameters,
    filter,
    width,
    height,
  }: ImagePickerResult) => {
    const size = downScaleImage(width, height, MODULE_IMAGE_MAX_WIDTH);
    const exportPath = await saveTransformedImageToFile({
      uri,
      resolution: size,
      format: getTargetFormatFromPath(uri),
      quality: 95,
      filter,
      editionParameters,
    });
    setShowImagePicker(false);
    onImageChange({
      uri: `file://${exportPath}`,
      width: size.width,
      height: size.height,
      kind: 'image',
    });
  };

  const onImagePickerCancel = useCallback(() => {
    setShowImagePicker(false);
  }, []);

  //#endregion

  // #region Fields edition handlers

  const onImageChange = fieldUpdateHandler('image');

  const onTitleFontFamilyChange = fieldUpdateHandler('titleFontFamily');

  const onTitleFontColorChange = fieldUpdateHandler('titleFontColor');

  const onTitleTextAlignChange = fieldUpdateHandler('titleTextAlign');

  const titleFontSize = useSharedValue(data.titleFontSize ?? null);

  const onContentChange = fieldUpdateHandler('content');

  const titleVerticalSpacing = useSharedValue(
    data.titleVerticalSpacing ??
      PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES.titleVerticalSpacing,
  );

  const onContentFontFamilyChange = fieldUpdateHandler('contentFontFamily');

  const onContentFontColorChange = fieldUpdateHandler('contentFontColor');

  const onContentTextAlignChange = fieldUpdateHandler('contentTextAlign');

  const contentFontSize = useSharedValue(data.contentFontSize ?? null);

  const onTitleChange = fieldUpdateHandler('title');

  const contentVerticalSpacing = useSharedValue(
    data.contentVerticalSpacing ??
      PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES.contentVerticalSpacing,
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

  const borderRadius = useSharedValue(data.borderRadius ?? null);

  const marginHorizontal = useSharedValue(
    data.marginHorizontal ??
      PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES.marginHorizontal,
  );

  const marginVertical = useSharedValue(
    data.marginVertical ??
      PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES.marginVertical,
  );

  const gap = useSharedValue(
    data.gap ?? PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES.gap,
  );

  const aspectRatio = useSharedValue(
    data.aspectRatio ?? PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES.aspectRatio,
  );

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

  const onSave = useCallback(async () => {
    if (!canSave || !profile.webCard) {
      return;
    }

    const requireSubscription = changeModuleRequireSubscription(
      'photoWithTextAndTitle',
      cardModulesCount,
    );

    if (
      profile.webCard?.cardIsPublished &&
      requireSubscription &&
      !profile.webCard?.isPremium
    ) {
      router.push({ route: 'USER_PAY_WALL' });
      return;
    }

    setProgressIndicator(Observable.from(0));

    const { image: updateImage } = value;
    let mediaId = updateImage?.id;

    if (!mediaId && updateImage?.uri) {
      try {
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

        const { progress: uploadProgress, promise: uploadPromise } =
          uploadMedia(file, uploadURL, uploadParameters);
        setProgressIndicator(
          uploadProgress.map(({ loaded, total }) => loaded / total),
        );
        const { public_id } = await uploadPromise;
        mediaId = public_id;
      } catch {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Could not save your module, media upload failed, try again later',
            description:
              'Error toast message when saving a photo with text and title failed because of a media upload error.',
          }),
        });
        setProgressIndicator(null);
        return;
      }
    }

    const input: SavePhotoWithTextAndTitleModuleInput = {
      ...data,
      moduleId: photoWithTextAndTitle?.id,
      titleFontSize: titleFontSize.value,
      titleVerticalSpacing: titleVerticalSpacing.value,
      contentFontSize: contentFontSize.value,
      contentVerticalSpacing: contentVerticalSpacing.value,
      marginHorizontal: marginHorizontal.value,
      borderRadius: borderRadius.value,
      marginVertical: marginVertical.value,
      gap: gap.value,
      aspectRatio: aspectRatio.value,
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
        webCardId: profile.webCard.id,
        input,
      },
      onCompleted() {
        setProgressIndicator(null);

        setShowImagePicker(false);
        router.back();
      },
      onError(e) {
        setProgressIndicator(null);

        setShowImagePicker(false);
        console.log(e);
        handleProfileActionError(e);
      },
    });
  }, [
    canSave,
    profile.webCard,
    cardModulesCount,
    value,
    data,
    photoWithTextAndTitle?.id,
    titleFontSize.value,
    titleVerticalSpacing.value,
    contentFontSize.value,
    contentVerticalSpacing.value,
    marginHorizontal.value,
    borderRadius.value,
    marginVertical.value,
    gap.value,
    aspectRatio.value,
    commit,
    router,
    intl,
    handleProfileActionError,
  ]);

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
        middleElement={
          <ModuleEditionScreenTitle
            label={intl.formatMessage({
              defaultMessage: 'Image & Text',
              description: 'PhotoWithTextAndTitle text screen title',
            })}
            kind="photoWithTextAndTitle"
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
          animatedData={{
            aspectRatio,
            borderRadius,
            gap,
            marginHorizontal,
            marginVertical,
            titleFontSize,
            titleVerticalSpacing,
            contentFontSize,
            contentVerticalSpacing,
          }}
          colorPalette={profile?.webCard?.cardColors}
          cardStyle={profile?.webCard?.cardStyle}
        />
      </PressableOpacity>
      <TabView
        style={{ height: bottomPanelHeight, flex: 1 }}
        currentTab={currentTab}
        tabs={[
          {
            id: 'text',
            element: (
              <PhotoWithTextAndTitleSettingsEditionPanel
                webCard={profile?.webCard ?? null}
                style={{
                  flex: 1,
                  marginBottom:
                    insetBottom +
                    BOTTOM_MENU_HEIGHT +
                    (Platform.OS === 'android' ? 15 : 0),
                }}
                bottomSheetHeight={bottomPanelHeight}
                titleFontFamily={titleFontFamily}
                onTitleFontFamilyChange={onTitleFontFamilyChange}
                titleFontColor={titleFontColor}
                onTitleFontColorChange={onTitleFontColorChange}
                titleTextAlign={titleTextAlign}
                onTitleTextAlignChange={onTitleTextAlignChange}
                titleFontSize={titleFontSize}
                titleVerticalSpacing={titleVerticalSpacing}
                contentFontFamily={contentFontFamily}
                onContentFontFamilyChange={onContentFontFamilyChange}
                contentFontColor={contentFontColor}
                onContentFontColorChange={onContentFontColorChange}
                contentTextAlign={contentTextAlign}
                onContentTextAlignChange={onContentTextAlignChange}
                contentFontSize={contentFontSize}
                contentVerticalSpacing={contentVerticalSpacing}
                onTouched={onTouched}
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
                aspectRatio={aspectRatio}
                style={{
                  flex: 1,
                  marginBottom:
                    insetBottom +
                    BOTTOM_MENU_HEIGHT +
                    (Platform.OS === 'android' ? 15 : 0),
                }}
                onTouched={onTouched}
              />
            ),
          },

          {
            id: 'margins',
            element: (
              <PhotoWithTextAndTitleMarginsEditionPanel
                marginHorizontal={marginHorizontal}
                marginVertical={marginVertical}
                gap={gap}
                style={{
                  flex: 1,
                  marginBottom:
                    insetBottom +
                    BOTTOM_MENU_HEIGHT +
                    (Platform.OS === 'android' ? 15 : 0),
                }}
                onTouched={onTouched}
              />
            ),
          },
          {
            id: 'background',
            element: (
              <PhotoWithTextAndTitleBackgroundEditionPanel
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
      <TextAreaModal
        visible={showContentModal}
        value={content ?? ''}
        placeholder={intl.formatMessage({
          defaultMessage: 'Enter text',
          description:
            'Placeholder for text area in photo with text edition screen',
        })}
        headerTitle={intl.formatMessage({
          defaultMessage: 'Edit text',
          description:
            'Text area modal title in photo with text edition screen',
        })}
        maxLength={PHOTO_WITH_TEXT_AND_TITLE_TEXT_MAX_LENGTH}
        onClose={onCloseContentModal}
        onChangeText={text => {
          onContentChange(text);
          onCloseContentModal();
        }}
        onFocus={() => {
          if (content === undefined) {
            onContentChange('');
          }
        }}
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
              onFocus={() => {
                if (title === undefined) {
                  onTitleChange('');
                }
              }}
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

      <PhotoWithTextAndTitleEditionBottomMenu
        currentTab={currentTab}
        onItemPress={onCurrentTabChange}
        style={[
          styles.tabsBar,
          { bottom: insetBottom, width: windowWidth - 20 },
        ]}
      />
      <ScreenModal
        visible={showImagePicker}
        onRequestDismiss={onImagePickerCancel}
      >
        <ImagePicker
          kind="image"
          onFinished={onMediaSelected}
          onCancel={onImagePickerCancel}
          steps={steps}
        />
      </ScreenModal>
      <ScreenModal
        visible={!!progressIndicator}
        onRequestDismiss={preventModalDismiss}
        gestureEnabled={false}
      >
        {progressIndicator && (
          <UploadProgressModal progressIndicator={progressIndicator} />
        )}
      </ScreenModal>
    </Container>
  );
};

const steps = [SelectImageStep, EditImageStep];

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
