import isEqual from 'lodash/isEqual';
import zip from 'lodash/zip';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  View,
  Image,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment, useMutation } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  COVER_MAX_HEIGHT,
  COVER_MAX_WIDTH,
  COVER_RATIO,
} from '@azzapp/shared/cardHelpers';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { useRouter, useWebAPI } from '#PlatformEnvironment';
import { colors } from '#theme';
import ImageEditionFooter from '#components/ImageEditionFooter';
import ImageEditionParameterControl from '#components/ImageEditionParameterControl';
import ImagePicker from '#components/ImagePicker';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getFileName, isFileURL } from '#helpers/fileHelpers';
import {
  calculImageSize,
  exportImage,
  isPNG,
  segmentImage,
} from '#helpers/mediaHelpers';
import BottomMenu, { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Button from '#ui/Button';
import Container from '#ui/Container';
import FloatingIconButton from '#ui/FloatingIconButton';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import SwitchLabel from '#ui/SwitchLabel';

import TabView from '#ui/TabView';
import UploadProgressModal from '#ui/UploadProgressModal';
import CoverEditionBackgroundPanel from './CoverEditionBackgroundPanel';
import CoverEditionForegroundPanel from './CoverEditionForegroundPanel';
import CoverEditionImagePickerSelectImageStep from './CoverEditionImagePickerSelectImageStep';
import CoverImageEditionPanel from './CoverImageEditionPanel';
import CoverModelsEditionPanel from './CoverModelsEditionPanel';
import CoverPreviewRenderer from './CoverPreviewRenderer';
import CoverTitleEditionPanel from './CoverTitleEditionPanel';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { EditableImageSource } from '#components/medias';
import type {
  CropData,
  ImageEditionParameters,
  ImageOrientation,
} from '#helpers/mediaHelpers';
import type { FooterBarItem } from '#ui/FooterBar';
import type { TabViewHandler } from '#ui/TabView';
import type { TemplateData } from './CoverModelsEditionPanel';
import type { CoverPreviewHandler } from './CoverPreviewRenderer';
import type { CoverEditionScreen_cover$key } from '@azzapp/relay/artifacts/CoverEditionScreen_cover.graphql';
import type { CoverEditionScreen_viewer$key } from '@azzapp/relay/artifacts/CoverEditionScreen_viewer.graphql';
import type {
  CardCoverBackgroundStyleInput,
  CardCoverContentStyleInput,
  CardCoverForegroundStyleInput,
  CardCoverTextStyleInput,
  CoverEditionScreenMutation,
  MediaInput,
  UpdateCoverInput,
} from '@azzapp/relay/artifacts/CoverEditionScreenMutation.graphql';
import type { LayoutChangeEvent } from 'react-native';
import type { Observable } from 'relay-runtime';

export type CoverEditionScreenProps = {
  /**
   * The relay viewer reference
   */
  viewer: CoverEditionScreen_viewer$key | null;
};

/**
 * Allows un user to edit his Cover, the cover changes, can be previsualized
 */
const CoverEditionScreen = ({ viewer: viewerKey }: CoverEditionScreenProps) => {
  //#region Data dependencies
  const viewer = useFragment(
    graphql`
      fragment CoverEditionScreen_viewer on Viewer {
        ...CoverEditionBackgroundPanel_viewer
        ...CoverEditionForegroundPanel_viewer
        ...CoverTitleEditionPanel_viewer
        ...CoverModelsEditionPanel_viewer
        profile {
          id
          userName
          firstName
          lastName
          companyName
          companyActivity {
            id
            label
          }
          profileKind
          card {
            id
            cover {
              ...CoverEditionScreen_cover
            }
          }
        }
        coverBackgrounds {
          id
          uri
          # we use arbitrary values here, but it should be good enough
          smallURI: uri(width: 125, pixelRatio: 2)
        }
        coverForegrounds {
          id
          uri
        }
      }
    `,
    viewerKey,
  );

  // we separate the cover fragment from the viewer fragment
  // for refetching in mutation response
  const cover = useFragment<CoverEditionScreen_cover$key>(
    graphql`
      fragment CoverEditionScreen_cover on CardCover {
        mediaStyle
        sourceMedia {
          id
          uri
          width
          height
        }
        maskMedia {
          id
          uri
        }
        background {
          id
          uri
        }
        foreground {
          id
          uri
        }
        backgroundStyle {
          backgroundColor
          patternColor
        }
        foregroundStyle {
          color
        }
        segmented
        merged
        title
        contentStyle {
          orientation
          placement
        }
        titleStyle {
          fontFamily
          fontSize
          color
        }
        subTitle
        subTitleStyle {
          fontFamily
          fontSize
          color
        }
      }
    `,
    viewer?.profile?.card?.cover ?? null,
  );

  //#endregion

  //#region Updates management
  const { firstName, lastName, companyName, profileKind } =
    viewer?.profile ?? {};
  const [updates, setUpdates] = useState<CoverEditionValue>(() => {
    if (cover) return {};
    const updatesValue: CoverEditionValue = {
      title:
        profileKind === 'personal'
          ? `${firstName} ${lastName}`.trim()
          : companyName,
      segmented: profileKind === 'personal',
      subTitle:
        profileKind === 'business'
          ? viewer?.profile?.companyActivity?.label
          : undefined,
    };

    if (profileKind === 'personal') {
      const assetDemo = Image.resolveAssetSource(
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('#assets/demo_asset.png'),
      );

      updatesValue.sourceMedia = {
        uri: assetDemo.uri,
        width: assetDemo.width * assetDemo.scale,
        height: assetDemo.height * assetDemo.scale,
      };
    }

    return updatesValue;
  });

  const updateFields = useCallback(
    <Key extends keyof CoverEditionValue>(
      ...entries: Array<[Key, CoverEditionValue[Key]]>
    ) => {
      setUpdates(updates => {
        updates = { ...updates };
        entries.forEach(([key, value]) => {
          switch (key) {
            case 'sourceMedia': {
              updates.sourceMedia = value as any;
              break;
            }
            case 'maskMedia':
              updates.maskMedia = value as any;
              break;
            case 'backgroundId':
              if (value === cover?.background?.id) {
                delete updates.backgroundId;
              } else {
                updates.backgroundId = value as any;
              }
              break;
            case 'foregroundId':
              if (value === cover?.foreground?.id) {
                delete updates.foregroundId;
              } else {
                updates.foregroundId = value as any;
              }
              break;
            default:
              if (isEqual(value, cover?.[key as keyof typeof cover])) {
                delete updates[key];
              } else {
                updates[key] = value;
              }
          }
        });

        return updates;
      });
    },
    [cover],
  );
  //#endregion

  //#region Displayed values computation;
  const {
    mediaStyle,
    sourceMedia,
    maskMedia,
    backgroundId,
    foregroundId,
    backgroundStyle,
    foregroundStyle,
    segmented,
    merged,
    title,
    contentStyle,
    titleStyle,
    subTitle,
    subTitleStyle,
  } = useMemo<CoverEditionValue>(
    () => ({
      mediaStyle: firstNotUndefined(updates.mediaStyle, cover?.mediaStyle),
      sourceMedia: firstNotUndefined(updates.sourceMedia, cover?.sourceMedia),
      maskMedia: firstNotUndefined(updates.maskMedia, cover?.maskMedia?.uri),
      backgroundId: firstNotUndefined(
        updates.backgroundId,
        cover?.background?.id,
      ),
      foregroundId: firstNotUndefined(
        updates.foregroundId,
        cover?.foreground?.id,
      ),
      backgroundStyle: firstNotUndefined(
        updates.backgroundStyle,
        cover?.backgroundStyle,
      ),
      foregroundStyle: firstNotUndefined(
        updates.foregroundStyle,
        cover?.foregroundStyle,
      ),
      segmented: firstNotUndefined(updates.segmented, cover?.segmented),
      merged: firstNotUndefined(updates.merged, cover?.merged),
      title: firstNotUndefined(updates.title, cover?.title),
      contentStyle: firstNotUndefined(
        updates.contentStyle,
        cover?.contentStyle,
      ),
      titleStyle: firstNotUndefined(updates.titleStyle, cover?.titleStyle),
      subTitle: firstNotUndefined(updates.subTitle, cover?.subTitle),
      subTitleStyle: firstNotUndefined(
        updates.subTitleStyle,
        cover?.subTitleStyle,
      ),
    }),
    [updates, cover],
  );

  const backgroundUri =
    viewer?.coverBackgrounds.find(background => background.id === backgroundId)
      ?.uri ?? null;
  const foregroundUri =
    viewer?.coverForegrounds.find(foreground => foreground.id === foregroundId)
      ?.uri ?? null;
  //#endregion

  //#region Mutation, Cancel and navigation
  const intl = useIntl();
  const rendererRef = useRef<CoverPreviewHandler | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] =
    useState<Observable<number> | null>(null);

  const isCreation = !cover;
  const [isDemoAsset, setIsDemoAsset] = useState(isCreation);
  const isDirty = Object.keys(updates).length > 0;
  const isValid =
    !isCreation || (updates.sourceMedia != null && !!updates.title);
  const [maskComputing, setMaskComputing] = useState(false);

  const canSave = !saving && isDirty && isValid && !maskComputing;

  const router = useRouter();
  const [commit] = useMutation<CoverEditionScreenMutation>(graphql`
    mutation CoverEditionScreenMutation($input: UpdateCoverInput!) {
      updateCover(input: $input) {
        profile {
          ...ProfileScreen_profile
          card {
            cover {
              ...CoverEditionScreen_cover
            }
          }
        }
      }
    }
  `);

  const { uploadMedia, uploadSign } = useWebAPI();
  const onSave = async () => {
    if (!canSave) {
      return;
    }
    if (isDemoAsset) {
      Alert.alert(
        '',
        intl.formatMessage({
          defaultMessage: 'Please select a photo',
          description: 'CoverEditionScreen Alert message select photo',
        }),
      );
      return;
    }
    setSaving(true);

    const shouldRecreateMedia =
      updates.sourceMedia != null ||
      updates.maskMedia != null ||
      updates.mediaStyle != null ||
      updates.backgroundId != null ||
      updates.backgroundStyle != null ||
      updates.foregroundId != null ||
      updates.foregroundStyle != null ||
      updates.segmented != null ||
      updates.merged != null;

    const mediaPath: string | null = shouldRecreateMedia
      ? await exportImage({
          uri: sourceMedia!.uri,
          size: { width: COVER_MAX_WIDTH, height: COVER_MAX_HEIGHT },
          parameters: mediaStyle?.parameters as ImageEditionParameters,
          filters: mediaStyle?.filter
            ? ([mediaStyle.filter] as string[])
            : undefined,
          quality: 0.8,
          maskUri: segmented
            ? updates.maskMedia ?? cover?.maskMedia?.uri
            : null,
          backgroundColor: backgroundStyle?.backgroundColor,
          backgroundImageUri: backgroundUri,
          backgroundImageTintColor: backgroundStyle?.patternColor,
          backgroundMultiply: merged,
          foregroundImageUri: foregroundUri,
          foregroundImageTintColor: foregroundStyle?.color,
        })
      : null;

    const shouldRecreateTextPreview =
      updates.title != null ||
      updates.contentStyle != null ||
      updates.titleStyle != null ||
      updates.subTitle != null ||
      updates.subTitleStyle != null;

    const textPreviewMediaPath = ((shouldRecreateTextPreview &&
      (await rendererRef.current?.capture())) ??
      null) as string | null; // could have a 'false' type

    const sourceMediaId = sourceMedia?.id;
    const shouldRecreateSourceMedia = updates.sourceMedia && !sourceMediaId;

    const mediaToUploads = [
      mediaPath,
      textPreviewMediaPath,
      shouldRecreateSourceMedia && updates.sourceMedia?.uri, // TODO limit the size of the source media
      updates.maskMedia, // TODO limit the size of the mask media
    ];

    let uploadInfos: Array<{
      uploadURL: string;
      uploadParameters: Record<string, any>;
    } | null>;

    try {
      uploadInfos = await Promise.all(
        mediaToUploads.map(path =>
          path
            ? uploadSign({
                kind: 'image',
                target: 'cover',
              })
            : null,
        ),
      );
    } catch (e) {
      console.error(e);
      setSaving(false);
      return;
    }

    const uploads = zip(mediaToUploads, uploadInfos).map(
      ([media, uploadInfos]) => {
        if (!media || !uploadInfos) {
          return null;
        }
        const { uploadURL, uploadParameters } = uploadInfos;
        return uploadMedia(
          {
            name: getFileName(media),
            uri: `file://${media}`,
            type: 'image/jpeg',
          } as any,
          uploadURL,
          uploadParameters,
        );
      },
    );

    const observables = convertToNonNullArray(
      uploads.map(upload => upload?.progress),
    );
    if (observables.length > 0) {
      setUploadProgress(
        combineLatest(observables).map(
          progresses =>
            progresses.reduce((a, b) => a + b, 0) / progresses.length,
        ),
      );
    }
    let mediaInput: MediaInput | undefined;
    let textPreviewMediaInput: MediaInput | undefined;
    let sourceMediaInput: MediaInput | undefined;
    let maskMediaInput: MediaInput | undefined;
    try {
      [mediaInput, textPreviewMediaInput, sourceMediaInput, maskMediaInput] =
        await Promise.all(
          uploads.map(upload =>
            upload?.promise.then(
              uploadResult =>
                ({
                  id: uploadResult.public_id as string,
                  width: uploadResult.width as number,
                  height: uploadResult.height as number,
                  kind: 'image',
                } as const),
            ),
          ),
        );
    } catch (e) {
      // TODO
      console.log(e);
      setSaving(false);
      setUploadProgress(null);
      return;
    }

    const input: UpdateCoverInput = {};

    if (shouldRecreateMedia && mediaInput) {
      input.media = mediaInput;
    }

    if (shouldRecreateTextPreview && textPreviewMediaInput) {
      input.textPreviewMedia = textPreviewMediaInput;
    }

    if (!cover && sourceMediaId) {
      // Business case using the default image
      input.sourceMedia = {
        id: sourceMediaId,
        height: sourceMedia.height,
        width: sourceMedia.width,
        kind: 'image',
      };
    } else if (sourceMediaInput) {
      input.sourceMedia = sourceMediaInput;
    }

    if (maskMediaInput) {
      input.maskMedia = maskMediaInput;
    }

    const entries = typedEntries(updates);
    entries.forEach(([key, value]) => {
      switch (key) {
        case 'title':
          input.title = value;
          break;
        case 'titleStyle':
          input.titleStyle = value;
          break;
        case 'contentStyle':
          input.contentStyle = value;
          break;
        case 'subTitle':
          input.subTitle = value;
          break;
        case 'subTitleStyle':
          input.subTitleStyle = value;
          break;
        case 'backgroundId':
          input.backgroundId = value;
          break;
        case 'backgroundStyle':
          input.backgroundStyle = value;
          break;
        case 'foregroundId':
          input.foregroundId = value;
          break;
        case 'foregroundStyle':
          input.foregroundStyle = value;
          break;
        case 'mediaStyle':
          input.mediaStyle = value;
          break;
        case 'merged':
          input.merged = value;
          break;
        case 'segmented':
          input.segmented = value;
          break;
        // already handled
        case 'sourceMedia':
        case 'maskMedia':
          break;
      }
    });

    commit({
      variables: { input },
      // TODO
      //optimisticResponse:
      onCompleted() {
        setSaving(false);
        setUploadProgress(null);
        router.replace({
          route: 'PROFILE',
          params: {
            userName: viewer!.profile!.userName,
            profileID: viewer!.profile!.id,
          },
        });
      },
      onError(e) {
        // eslint-disable-next-line no-alert
        // TODO better error handling
        console.log(e);
        setSaving(false);
        setUploadProgress(null);
      },
    });
  };

  const onCancel = () => {
    router.back();
  };
  //#endregion

  //#region Image Picker state
  const [showImagePicker, setShowImagePicker] = useState(false);

  const onPickImage = () => {
    setShowImagePicker(true);
  };

  const onMediaSelected = async ({
    uri,
    width,
    height,
    editionParameters,
  }: ImagePickerResult) => {
    //we will use the export image directly, no compression
    const imagePickerBoxed = { width, height, uri };
    const editionParametersBoxed = { ...editionParameters };
    if (
      width > COVER_MAX_IMAGE_DIMENSION ||
      height > COVER_MAX_IMAGE_DIMENSION
    ) {
      const resize = calculImageSize(width, height, COVER_MAX_IMAGE_DIMENSION);
      const resizePath = await exportImage({
        uri,
        size: { width: resize.width, height: resize.height },
        format: isPNG(uri) ? 'PNG' : 'JPEG',
      });
      imagePickerBoxed.width = resize.width;
      imagePickerBoxed.height = resize.height;
      imagePickerBoxed.uri = `file://${resizePath}`;

      //don't forget to update the crop data
      if (editionParametersBoxed.cropData) {
        editionParametersBoxed.cropData.width = Math.min(
          resize.width,
          editionParametersBoxed.cropData.width,
        );
        editionParametersBoxed.cropData.height = Math.min(
          resize.height,
          editionParametersBoxed.cropData.height,
        );
      }
    }

    updateFields(
      ['sourceMedia', imagePickerBoxed],
      [
        'mediaStyle',
        {
          ...mediaStyle,
          parameters: editionParametersBoxed,
        },
      ],
    );
    setIsDemoAsset(false);
    setShowImagePicker(false);
  };

  useEffect(() => {
    let canceled = false;
    if (sourceMedia && isFileURL(sourceMedia.uri)) {
      setMaskComputing(true);
      segmentImage(sourceMedia.uri)
        .then(path => {
          if (canceled) {
            return;
          }
          updateFields(['maskMedia', `file://${path}`]);
        })
        .catch(e => {
          // TODO
          console.log(e);
        })
        .finally(() => {
          setMaskComputing(false);
        });
    }
    return () => {
      setMaskComputing(false);
      canceled = true;
    };
    // we only want this to apply when sourceMedia changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceMedia]);

  const onImagePickerCancel = () => {
    if (sourceMedia) {
      setShowImagePicker(false);
    } else {
      //the user should always be able to cancel, even cancelling the process
      router.back();
    }
  };
  //#endregion

  //#region displayed image
  const imageSource = useMemo<EditableImageSource | null>(() => {
    if (sourceMedia) {
      return {
        kind: 'image',
        uri: sourceMedia.uri,
        maskUri: !maskComputing && segmented ? maskMedia : null,
        backgroundUri,
        foregroundUri,
      };
    }
    return null;
  }, [
    sourceMedia,
    maskComputing,
    segmented,
    maskMedia,
    backgroundUri,
    foregroundUri,
  ]);

  const sourceMediaSize = useMemo(() => {
    if (sourceMedia) {
      return {
        width: sourceMedia.width,
        height: sourceMedia.height,
      };
    }
    return null;
  }, [sourceMedia]);
  //#endregion

  //#region Media style edition
  const filter = useMemo<string | null>(
    () => (mediaStyle ? (mediaStyle.filter as string) : null),
    [mediaStyle],
  );

  const onFilterChange = (filter: string) => {
    updateFields(['mediaStyle', { ...mediaStyle, filter }]);
  };

  const [editedParameter, setEditedParameter] = useState<
    keyof ImageEditionParameters | null
  >(null);

  const editionParameters = useMemo<ImageEditionParameters>(
    () =>
      (mediaStyle && (mediaStyle.parameters as ImageEditionParameters)) ?? {},
    [mediaStyle],
  );

  const editionParametersSave = useRef(editionParameters);
  const onStartParameterEdition = (param: keyof ImageEditionParameters) => {
    editionParametersSave.current = editionParameters;
    setEditedParameter(param);
  };

  const onParameterValueChange = useCallback(
    <T extends keyof ImageEditionParameters>(
      param: T,
      value: ImageEditionParameters[T],
    ) => {
      // we can't use updateFields here because we need to update the mediaStyle
      // and we could have race conditions if multiple parameters are edited
      // at the same time
      setUpdates(updates => ({
        ...updates,
        mediaStyle: {
          ...cover?.mediaStyle,
          ...updates.mediaStyle,
          parameters: {
            ...(cover?.mediaStyle?.parameters as any),
            ...(updates.mediaStyle?.parameters as any),
            [param]: value,
          },
        },
      }));
    },
    [cover?.mediaStyle],
  );

  const onEditedParameterValueChange = (value: any) => {
    onParameterValueChange(editedParameter!, value);
  };

  const onCropDataChange = useCallback(
    (value: CropData) => {
      onParameterValueChange('cropData', value);
    },
    [onParameterValueChange],
  );

  const onParameterEditionSave = () => {
    setEditedParameter(null);
  };

  const onParameterEditionCancel = () => {
    updateFields([
      'mediaStyle',
      {
        ...mediaStyle,
        parameters: editionParametersSave.current,
      },
    ]);
    setEditedParameter(null);
  };

  const onNextOrientation = useCallback(() => {
    let nextOrientation: ImageOrientation;
    switch (editionParameters.orientation) {
      case 'LEFT':
        nextOrientation = 'DOWN';
        break;
      case 'DOWN':
        nextOrientation = 'RIGHT';
        break;
      case 'RIGHT':
        nextOrientation = 'UP';
        break;
      case 'UP':
      default:
        nextOrientation = 'LEFT';
        break;
    }
    onParameterValueChange('orientation', nextOrientation);
  }, [editionParameters.orientation, onParameterValueChange]);

  const onActivateCropMode = () => {
    // a little hack since we allow roll to be edited in crop mode
    setEditedParameter('roll');
  };
  //#endregion

  //#region Segmentation and merge
  const onToggleMerge = () => {
    updateFields(['merged', !merged]);
  };

  const onToggleSegmentation = () => {
    updateFields(['segmented', !segmented]);
  };
  //#endregion

  //#region Content edition
  const onTitleChange = (title: string) => {
    updateFields(['title', title]);
  };

  const onTitleStyleChange = (style: CardCoverTextStyleInput) => {
    updateFields(['titleStyle', style]);
  };

  const onSubTitleChange = (subTitle: string) => {
    updateFields(['subTitle', subTitle]);
  };

  const onSubTitleStyleChange = (style: CardCoverTextStyleInput) => {
    updateFields(['subTitleStyle', style]);
  };

  const onContentStyleChange = (style: CardCoverContentStyleInput) => {
    updateFields(['contentStyle', style]);
  };
  //#endregion

  //#region Background

  const onBackgroundChange = (backgroundId: string | null) => {
    updateFields(['backgroundId', backgroundId]);
  };

  const onBackgroundStyleChange = (style: CardCoverBackgroundStyleInput) => {
    updateFields(['backgroundStyle', style]);
  };
  //#endregion

  //#region Foreground and merge
  const onForegroundChange = (foregroundId: string | null) => {
    updateFields(['foregroundId', foregroundId]);
  };
  const onForegroundStyleChange = (style: CardCoverForegroundStyleInput) => {
    updateFields(['foregroundStyle', style]);
  };
  //#endregion

  //#region Template selection

  const [templateId, setTemplateId] = useState<string | null>(null);

  const onSelectTemplate = useCallback(
    (templateId: string, data: TemplateData) => {
      setTemplateId(templateId);
      const mediaStayleParameters: any = {
        ...(data?.mediaStyle?.parameters ?? {}),
        cropData: editionParameters.cropData ?? null,
      };
      // orientation cannot be null or will cause a crash
      if (editionParameters.orientation) {
        mediaStayleParameters.orientation = editionParameters.orientation;
      }
      updateFields(
        [
          'mediaStyle',
          {
            ...data.mediaStyle,
            filter: data.mediaStyle?.filter ?? null,
            parameters: mediaStayleParameters,
          },
        ],
        ['backgroundId', data.background?.id ?? null],
        ['foregroundId', data.foreground?.id ?? null],
        ['contentStyle', data.contentStyle],
        ['backgroundStyle', data.backgroundStyle ?? null],
        ['foregroundStyle', data.foregroundStyle ?? null],
        ['merged', data.merged],
        ['segmented', data.segmented],
        ['subTitleStyle', data.subTitleStyle ?? null],
        ['titleStyle', data.titleStyle],
      );
      if (
        isCreation &&
        profileKind !== 'personal' &&
        updates.sourceMedia?.id == null
      ) {
        updateFields(['sourceMedia', data.sourceMedia]);
      }
    },
    [
      editionParameters,
      updates.sourceMedia?.id,
      updateFields,
      isCreation,
      profileKind,
    ],
  );
  //#endregion

  const [currentTab, setCurrentTab] = useState<string>('models');

  const appearanceStyle = useStyleSheet(computedStyle);
  const cropEditionMode = editedParameter === 'roll';

  const [bottomSheetHeights, setBottomSheetHeights] = useState(0);
  const onBottomPanelLayout = (event: LayoutChangeEvent) => {
    setBottomSheetHeights(event.nativeEvent.layout.height);
  };

  const [heighCover, setHeightCover] = useState(0);
  const onContainerLayout = ({
    nativeEvent: { layout },
  }: LayoutChangeEvent) => {
    setHeightCover(layout.height);
  };
  const { width } = useWindowDimensions();
  const { bottom, top } = useSafeAreaInsets();
  const bottomMargin = bottom > 0 ? bottom : FIXED_BOTTOM_MARGIN;
  //Bottom Menu navigation. cannot put it ouside as constant because of react-intl
  const menus: FooterBarItem[] = useMemo(
    () => [
      {
        key: 'models',
        icon: 'templates',
        label: intl.formatMessage({
          defaultMessage: 'Models',
          description: 'CoverEditionScreen bottom menu label for models tab',
        }),
      },
      {
        key: 'image',
        icon: 'image',
        label: intl.formatMessage({
          defaultMessage: 'Image',
          description: 'CoverEditionScreen bottom menu label for Image tab',
        }),
      },
      {
        key: 'title',
        icon: 'text',
        label: intl.formatMessage({
          defaultMessage: 'Text',
          description: 'CoverEditionScreen bottom menu label for Text tab',
        }),
      },
      {
        key: 'foreground',
        icon: 'foreground',
        label: intl.formatMessage({
          defaultMessage: 'Fore.',
          description:
            'CoverEditionScreen bottom menu label for Foreground tab',
        }),
      },
      {
        key: 'background',
        icon: 'background',
        label: intl.formatMessage({
          defaultMessage: 'Back.',
          description:
            'CoverEditionScreen bottom menu label for Background tab',
        }),
      },
    ],
    [intl],
  );
  const tabViewRef = useRef<TabViewHandler>(null);
  const navigateToPanel = useCallback(
    (menu: string) => {
      setCurrentTab(menu);
      const index = menus.findIndex(m => m.key === menu);
      tabViewRef.current?.navigateToTab(index);
    },
    [menus],
  );

  if (!viewer) {
    return null;
  }

  return (
    //ths container on top avoid some weid feeling when transitionning with transparent backgorund
    <Container style={styles.containerStyle}>
      <KeyboardAvoidingView
        contentContainerStyle={[styles.root, { paddingTop: top }]}
        behavior="position"
      >
        <Header
          middleElement={
            isCreation
              ? intl.formatMessage({
                  defaultMessage: 'Create your cover',
                  description: 'Cover creation screen title',
                })
              : intl.formatMessage({
                  defaultMessage: 'Update your cover',
                  description: 'Cover edition screen title',
                })
          }
          leftElement={
            !cropEditionMode ? (
              <Button
                variant="secondary"
                onPress={onCancel}
                label={intl.formatMessage({
                  defaultMessage: 'Cancel',
                  description: 'Cancel button label in cover edition screen',
                })}
              />
            ) : null
          }
          rightElement={
            cropEditionMode ? (
              <IconButton
                icon="crop" //TODO: this button is not present in figma (rotation is still a WIP in figma), rotate does not exist anymore
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Rotate',
                  description:
                    'Accessibility label of the rotate button in the cover edition screen',
                })}
                accessibilityHint={intl.formatMessage({
                  defaultMessage:
                    'Rotate the image by 90° clockwise. This will change the crop area.',
                  description:
                    'Accessibility hint of the rotate button in in the cover edition screen',
                })}
                onPress={onNextOrientation}
              />
            ) : (
              <Button
                disabled={!canSave}
                onPress={onSave}
                label={intl.formatMessage({
                  defaultMessage: 'Save',
                  description: 'Save button label in cover edition screen',
                })}
              />
            )
          }
        />
        <View style={styles.topPanel}>
          <CoverPreviewRenderer
            ref={rendererRef}
            source={imageSource}
            mediaSize={sourceMediaSize}
            foregroundImageTintColor={
              cropEditionMode
                ? makeTranslucent(foregroundStyle?.color)
                : foregroundStyle?.color
            }
            backgroundImageColor={backgroundStyle?.backgroundColor}
            backgroundMultiply={merged}
            backgroundImageTintColor={backgroundStyle?.patternColor}
            editionParameters={{
              ...editionParameters,
              //TODO: find the right tuning, this is applying a filter on all the image, not only on the demo asset. maybe using a darkened demo asset?
              brightness: isDemoAsset ? -0.5 : editionParameters.brightness,
              contrast: isDemoAsset ? 0.5 : editionParameters.contrast,
              saturation: isDemoAsset ? 0 : editionParameters.saturation,
            }}
            filter={filter}
            title={title}
            subTitle={subTitle}
            titleStyle={titleStyle}
            subTitleStyle={subTitleStyle}
            contentStyle={contentStyle}
            computing={segmented && maskComputing}
            cropEditionMode={cropEditionMode}
            onCropDataChange={onCropDataChange}
            onLayout={onContainerLayout}
            style={appearanceStyle.coverShadow}
          />
          {sourceMedia && !cropEditionMode && (
            <FloatingIconButton
              icon="crop"
              iconSize={24}
              onPress={onActivateCropMode}
              style={[
                styles.cropButton,
                { top: (heighCover - ICON_SIZE) / 2 + PADDING_TOP_TOPPANEL },
              ]}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Crop',
                description: 'Accessibility label of the crop button',
              })}
              accessibilityHint={intl.formatMessage({
                defaultMessage:
                  'Press this button to adjust the boundary of the selected image',
                description: 'Accessibility hint of the crop button',
              })}
            />
          )}
          {!cropEditionMode && (
            <FloatingIconButton
              icon="camera"
              iconSize={24}
              onPress={onPickImage}
              style={[
                styles.takePictureButton,
                { top: (heighCover - ICON_SIZE) / 2 + PADDING_TOP_TOPPANEL },
              ]}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Select an image',
                description:
                  'Accessibility label of the image selection button',
              })}
              accessibilityHint={intl.formatMessage({
                defaultMessage:
                  'Press this button to select an image from your library',
                description: 'Accessibility hint of the image selection button',
              })}
            />
          )}
          <View style={[styles.toolbar, appearanceStyle.toolbar]}>
            <SwitchLabel
              variant="small"
              value={segmented ?? false}
              onValueChange={onToggleSegmentation}
              label={intl.formatMessage({
                defaultMessage: 'Clipping',
                description: 'Label of the clipping switch in cover edition',
              })}
              style={styles.toolbarElement}
            />
            {currentTab !== 'models' && (
              <SwitchLabel
                variant="small"
                value={merged ?? false}
                onValueChange={onToggleMerge}
                label={intl.formatMessage({
                  defaultMessage: 'Merge',
                  description: 'Label of the merge switch in cover edition',
                })}
                style={[styles.toolbarElement]}
              />
            )}
          </View>
        </View>

        <TabView
          onLayout={onBottomPanelLayout}
          style={{ minHeight: MINIMAL_BOTTOM_HEIGHT }}
          ref={tabViewRef}
        >
          <CoverModelsEditionPanel
            viewer={viewer}
            segmented={segmented ?? false}
            imageSource={imageSource}
            mediaSize={sourceMediaSize}
            title={title}
            subTitle={subTitle}
            selectedTemplateId={templateId}
            onSelectTemplate={onSelectTemplate}
            isCreation={isCreation}
            editionParameters={editionParameters}
          />

          <CoverImageEditionPanel
            media={imageSource}
            filter={filter}
            editionParameters={editionParameters}
            merged={merged ?? false}
            foregroundImageTintColor={foregroundStyle?.color}
            backgroundImageColor={backgroundStyle?.backgroundColor}
            backgroundImageTintColor={backgroundStyle?.patternColor}
            onFilterChange={onFilterChange}
            onStartParameterEdition={onStartParameterEdition}
            style={[
              styles.bottomPanel,
              {
                marginBottom: bottomMargin + BOTTOM_MENU_HEIGHT,
                width,
              },
            ]}
          />
          <CoverTitleEditionPanel
            viewer={viewer}
            title={title}
            subTitle={subTitle}
            titleStyle={titleStyle}
            subTitleStyle={subTitleStyle}
            contentStyle={contentStyle}
            onTitleChange={onTitleChange}
            onSubTitleChange={onSubTitleChange}
            onTitleStyleChange={onTitleStyleChange}
            onSubTitleStyleChange={onSubTitleStyleChange}
            onContentStyleChange={onContentStyleChange}
            bottomSheetHeights={bottomSheetHeights}
            style={[
              styles.bottomPanel,
              {
                marginBottom: bottomMargin + BOTTOM_MENU_HEIGHT,
                width,
              },
            ]}
          />

          <CoverEditionBackgroundPanel
            viewer={viewer}
            background={backgroundId}
            backgroundStyle={backgroundStyle}
            onBackgroundChange={onBackgroundChange}
            onBackgroundStyleChange={onBackgroundStyleChange}
            bottomSheetHeights={bottomSheetHeights}
            style={[
              styles.bottomPanel,
              {
                marginBottom: bottomMargin + BOTTOM_MENU_HEIGHT,
                width,
              },
            ]}
          />

          <CoverEditionForegroundPanel
            viewer={viewer}
            foreground={foregroundId}
            foregroundStyle={foregroundStyle}
            onForegroundChange={onForegroundChange}
            onForegroundStyleChange={onForegroundStyleChange}
            bottomSheetHeights={bottomSheetHeights}
            style={[
              styles.bottomPanel,
              {
                marginBottom: bottomMargin + BOTTOM_MENU_HEIGHT,
                width,
              },
            ]}
          />
        </TabView>
        <BottomMenu
          currentTab={currentTab}
          onItemPress={navigateToPanel}
          showLabel
          tabs={menus}
          style={[styles.tabsBar, { bottom: bottomMargin, width: width - 20 }]}
        />
        {editedParameter != null && (
          <Container
            style={[
              {
                position: 'absolute',
                bottom: 0,
                width,
                minHeight: MINIMAL_BOTTOM_HEIGHT + 10,
              },
            ]}
          >
            <ImageEditionParameterControl
              value={editionParameters[editedParameter] as any}
              parameter={editedParameter}
              onChange={onEditedParameterValueChange}
              style={{ flex: 1 }}
            />
            <ImageEditionFooter
              onSave={onParameterEditionSave}
              onCancel={onParameterEditionCancel}
            />
          </Container>
        )}
      </KeyboardAvoidingView>
      <Modal
        visible={showImagePicker}
        animationType={sourceMedia ? 'slide' : 'none'}
        onRequestClose={onImagePickerCancel}
      >
        <ImagePicker
          kind="image"
          forceAspectRatio={COVER_RATIO}
          onFinished={onMediaSelected}
          onCancel={onImagePickerCancel}
          steps={[CoverEditionImagePickerSelectImageStep]}
        />
      </Modal>
      <UploadProgressModal
        visible={!!uploadProgress}
        progressIndicator={uploadProgress}
      />
    </Container>
  );
};

export default CoverEditionScreen;

const PADDING_TOP_TOPPANEL = 15;
const ICON_SIZE = 50;
const FIXED_BOTTOM_MARGIN = 15;
const MINIMAL_BOTTOM_HEIGHT = 314;
const computedStyle = createStyleSheet(appearance => ({
  toolbar: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    shadowColor: appearance === 'light' ? colors.grey900 : colors.grey600,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
  },
  coverShadow: {
    shadowColor: appearance === 'light' ? colors.black : colors.white,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 40,
  },
}));
const styles = StyleSheet.create({
  containerStyle: { flex: 1 },
  bottomPanelContainer: {
    minHeight: MINIMAL_BOTTOM_HEIGHT,
    flex: 1,
    flexDirection: 'row',
  },
  root: {
    width: '100%',
    height: '100%',
  },
  topPanel: {
    height: '50%',
    flexShrink: 1,
    alignItems: 'center',
    paddingTop: PADDING_TOP_TOPPANEL,
  },
  cropButton: {
    position: 'absolute',
    end: 22.5,
    borderWidth: 1,
  },
  takePictureButton: {
    position: 'absolute',
    start: 22.5,
    borderWidth: 1,
  },
  cover: {
    flex: 1,
  },
  maskComputingOverlay: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: COVER_RATIO,
  },
  bottomPanel: {
    flex: 1,
    marginTop: 10,
  },
  tabsBar: {
    position: 'absolute',
    bottom: FIXED_BOTTOM_MARGIN,
    left: 10,
    right: 10,
  },
  toolbar: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
    paddingLeft: 15,
    paddingRight: 5,
  },
  toolbarElement: {
    marginRight: 10,
    height: 22,
  },
  imageButton: {
    backgroundColor: colors.grey50,
    height: 33,
    width: 33,
    padding: 0,
    borderRadius: 16.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPicture: {
    width: 16,
    height: 16,
  },
});

type CoverEditionValue = {
  sourceMedia?: {
    id?: string;
    uri: string;
    width: number;
    height: number;
  } | null;
  maskMedia?: string | null;
  backgroundId?: string | null;
  backgroundStyle?: CardCoverBackgroundStyleInput | null;
  contentStyle?: CardCoverContentStyleInput | null;
  foregroundId?: string | null;
  foregroundStyle?: CardCoverForegroundStyleInput | null;
  mediaStyle?: Record<string, unknown> | null;
  merged?: boolean | null;
  segmented?: boolean | null;
  subTitle?: string | null;
  subTitleStyle?: CardCoverTextStyleInput | null;
  title?: string | null;
  titleStyle?: CardCoverTextStyleInput | null;
};

const firstNotUndefined = <T extends any[]>(...values: T) => {
  for (const value of values) {
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
};

const makeTranslucent = (color: string | null | undefined) =>
  (color ?? '#000000') + 'CC';

const COVER_MAX_IMAGE_DIMENSION = 4096;
