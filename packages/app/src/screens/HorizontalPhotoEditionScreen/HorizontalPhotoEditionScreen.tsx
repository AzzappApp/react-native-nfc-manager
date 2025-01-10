import omit from 'lodash/omit';
import { startTransition, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { Observable } from 'relay-runtime';
import {
  getHorizontalPhotoDefaultColors,
  HORIZONTAL_PHOTO_DEFAULT_VALUES,
  HORIZONTAL_PHOTO_STYLE_VALUES,
  MODULE_IMAGE_MAX_WIDTH,
} from '@azzapp/shared/cardModuleHelpers';
import { changeModuleRequireSubscription } from '@azzapp/shared/subscriptionHelpers';
import AnimatedDataOverride from '#components/AnimatedDataOverride';
import { CameraButton } from '#components/commonsButtons';
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
          cardIsPublished
          coverBackgroundColor
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
          isPremium
          cardModules {
            id
          }
          ...HorizontalPhotoBorderEditionPanel_webCard
          ...ModuleEditionScreenTitle_webCard
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
      ...getHorizontalPhotoDefaultColors(
        profile.webCard?.coverBackgroundColor,
        horizontalPhoto,
      ),
    };
  }, [horizontalPhoto, profile.webCard?.coverBackgroundColor]);

  const { data, value, fieldUpdateHandler, dirty } = useModuleDataEditor({
    initialValue,
    cardStyle: profile?.webCard?.cardStyle,
    styleValuesMap: HORIZONTAL_PHOTO_STYLE_VALUES,
    defaultValues: HORIZONTAL_PHOTO_DEFAULT_VALUES,
  });

  const { borderColor, backgroundId, backgroundStyle, image } = data;

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
        $webCardId: ID!
        $input: SaveHorizontalPhotoModuleInput!
      ) {
        saveHorizontalPhotoModule(webCardId: $webCardId, input: $input) {
          webCard {
            id
            requiresSubscription
            cardModules {
              id
              kind
              visible
              variant
              ...HorizontalPhotoEditionScreen_module
            }
          }
        }
      }
    `);

  const isValid = image?.id ?? image?.uri;

  const [touched, setTouched] = useState(false);

  const onTouched = useCallback(() => {
    setTouched(true);
  }, [setTouched]);

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const canSave =
    (dirty || touched) && isValid && !saving && !progressIndicator;

  const router = useRouter();
  const intl = useIntl();

  const cardModulesCount =
    (profile.webCard?.cardModules.length ?? 0) + (horizontalPhoto ? 0 : 1);

  const onCancel = router.back;

  const handleProfileActionError = useHandleProfileActionError(
    intl.formatMessage({
      defaultMessage: 'Could not save your photo module, try again later',
      description:
        'Error toast message when saving a horizontal photo module failed because of an unknown error.',
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
    width,
    height,
    editionParameters,
    filter,
  }: ImagePickerResult) => {
    const size = downScaleImage(
      editionParameters.cropData?.width ?? width,
      editionParameters.cropData?.height ?? height,
      MODULE_IMAGE_MAX_WIDTH,
    );
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
      uri: exportPath,
      width: size.width,
      height: size.height,
      kind: 'image',
    });
  };

  const onImagePickerCancel = useCallback(() => {
    setShowImagePicker(false);
  }, [setShowImagePicker]);
  //#endregion

  // #region Fields edition handlers
  const borderWidth = useSharedValue(
    data.borderWidth ?? HORIZONTAL_PHOTO_DEFAULT_VALUES.borderWidth,
  );

  const borderRadius = useSharedValue(data.borderRadius ?? null);

  const onBordercolorChange = fieldUpdateHandler('borderColor');

  const marginHorizontal = useSharedValue(
    data.marginHorizontal ?? HORIZONTAL_PHOTO_DEFAULT_VALUES.marginHorizontal,
  );

  const marginVertical = useSharedValue(
    data.marginVertical ?? HORIZONTAL_PHOTO_DEFAULT_VALUES.marginVertical,
  );

  const imageHeight = useSharedValue(
    data.imageHeight ?? HORIZONTAL_PHOTO_DEFAULT_VALUES.imageHeight,
  );

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

  const onImageChange = fieldUpdateHandler('image');

  const animatedData = useDerivedValue(() => ({
    borderWidth: borderWidth.value,
    borderRadius: borderRadius.value,
    marginHorizontal: marginHorizontal.value,
    marginVertical: marginVertical.value,
    imageHeight: imageHeight.value,
  }));

  const onSave = useCallback(async () => {
    if (!canSave || !profile.webCard) {
      return;
    }

    const requireSubscription = changeModuleRequireSubscription(
      'horizontalPhoto',
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

    const { image: updateMedia, ...rest } = value;

    let mediaId = updateMedia?.id;
    if (!mediaId && updateMedia?.uri) {
      try {
        //we need to save the media first
        const { uploadURL, uploadParameters } = await uploadSign({
          kind: 'image',
          target: 'module',
        });
        const fileName = getFileName(updateMedia.uri);
        const file: any = {
          name: fileName,
          uri: updateMedia.uri,
          type: 'image/jpeg',
        };

        const { progress: uploadProgress, promise: uploadPromise } =
          uploadMedia(file, uploadURL, uploadParameters);

        setProgressIndicator(
          uploadProgress.map(({ loaded, total }) => loaded / total),
        );
        const { public_id } = await uploadPromise;
        mediaId = public_id;
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
        setProgressIndicator(null);
        return;
      }
    }

    const input: SaveHorizontalPhotoModuleInput = {
      ...data,
      moduleId: horizontalPhoto?.id,
      image: mediaId ?? value.image!.id,
      ...rest,
      marginHorizontal: marginHorizontal.value,
      marginVertical: marginVertical.value,
      borderWidth: borderWidth.value,
      borderRadius: borderRadius.value,
      imageHeight: imageHeight.value,
    };

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

        console.error(e);
        setShowImagePicker(false);
        handleProfileActionError(e);
      },
    });
  }, [
    canSave,
    cardModulesCount,
    profile.webCard,
    value,
    data,
    horizontalPhoto?.id,
    marginHorizontal,
    marginVertical,
    borderWidth,
    borderRadius,
    imageHeight,
    commit,
    router,
    intl,
    handleProfileActionError,
  ]);

  // #endregion

  // #region tabs

  const [currentTab, setCurrentTab] = useState('settings');
  const onCurrentTabChange = useCallback((currentTab: string) => {
    startTransition(() => {
      setCurrentTab(currentTab);
    });
  }, []);

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
              defaultMessage: 'Horizontal Image',
              description: 'HorizontalPhoto text screen title',
            })}
            kind="horizontalPhoto"
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
        <AnimatedDataOverride data={previewData} animatedData={animatedData}>
          {data => (
            <HorizontalPhotoPreview
              style={{ height: topPanelHeight - 110, marginVertical: 10 }}
              data={data}
              colorPalette={profile?.webCard?.cardColors}
              cardStyle={profile?.webCard?.cardStyle}
            />
          )}
        </AnimatedDataOverride>
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
                style={styles.tabStyle}
                onTouched={onTouched}
              />
            ),
          },
          {
            id: 'border',
            element: (
              <HorizontalPhotoBorderEditionPanel
                borderWidth={borderWidth}
                borderRadius={borderRadius}
                borderColor={borderColor}
                onBorderColorChange={onBordercolorChange}
                webCard={profile?.webCard ?? null}
                bottomSheetHeight={bottomPanelHeight}
                style={styles.tabStyle}
                onTouched={onTouched}
              />
            ),
          },
          {
            id: 'margins',
            element: (
              <HorizontalPhotoMarginsEditionPanel
                marginHorizontal={marginHorizontal}
                marginVertical={marginVertical}
                onTouched={onTouched}
                style={styles.tabStyle}
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
                style={styles.tabStyle}
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
  tabStyle: {
    flex: 1,
    marginBottom: BOTTOM_MENU_HEIGHT,
  },
});
