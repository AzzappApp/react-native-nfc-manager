import isEqual from 'lodash/isEqual';
import zip from 'lodash/zip';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  View,
} from 'react-native';
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
import Header from '#components/Header';
import ImageEditionFooter from '#components/ImageEditionFooter';
import ImageEditionParameterControl from '#components/ImageEditionParameterControl';
import ImagePicker from '#components/ImagePicker';
import { getFileName, isFileURL } from '#helpers/fileHelpers';
import {
  calculImageSize,
  exportImage,
  isPNG,
  segmentImage,
} from '#helpers/mediaHelpers';
import useViewportSize, { insetBottom, insetTop } from '#hooks/useViewportSize';
import Button from '#ui/Button';
import FloatingIconButton from '#ui/FloatingIconButton';
import IconButton from '#ui/IconButton';
import Switch from '#ui/Switch';
import TabsBar, { TAB_BAR_HEIGHT } from '#ui/TabsBar';
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
import type { TemplateData } from './CoverModelsEditionPanel';
import type { CoverPreviewHandler } from './CoverPreviewRenderer';
import type { CoverEditionScreen_cover$key } from '@azzapp/relay/artifacts/CoverEditionScreen_cover.graphql';
import type { CoverEditionScreen_template$key } from '@azzapp/relay/artifacts/CoverEditionScreen_template.graphql';
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

  coverTemplate?: CoverEditionScreen_template$key | null;
};

/**
 * Allows un user to edit his Cover, the cover changes, can be previsualized
 */
const CoverEditionScreen = ({
  viewer: viewerKey,
  coverTemplate: coverTemplateKey,
}: CoverEditionScreenProps) => {
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

  const coverTemplate = useFragment<CoverEditionScreen_template$key>(
    graphql`
      fragment CoverEditionScreen_template on CoverTemplate {
        id
        colorPalette
        tags
        data {
          mediaStyle
          sourceMedia {
            uri
            id
            width
            height
          }
          backgroundStyle {
            backgroundColor
            patternColor
          }
          background {
            id
          }
          foreground {
            id
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
      }
    `,
    coverTemplateKey ?? null,
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
    if (coverTemplate) {
      const { background, foreground, ...rest } = coverTemplate.data;
      if (coverTemplate?.data) {
        return {
          ...rest,
          backgroundId: background?.id,
          foregroundId: foreground?.id,
          title:
            profileKind === 'personal'
              ? `${firstName} ${lastName}`
              : companyName,
        };
      }
    }
    return {
      title:
        profileKind === 'personal' ? `${firstName} ${lastName}` : companyName,
    };
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
  const rendererRef = useRef<CoverPreviewHandler | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] =
    useState<Observable<number> | null>(null);

  const isCreation = !cover;
  const isDirty = Object.keys(updates).length > 0;
  const isValid =
    !isCreation || (updates.sourceMedia != null && !!updates.title);
  const [maskComputing, setMaskComputing] = useState(false);
  const canSave = !saving && isDirty && isValid && !maskComputing;
  const canCancel = !isCreation && !saving;

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
        if (isCreation && viewer) {
          router.replace({
            route: 'PROFILE',
            params: { userName: viewer.profile!.userName },
          });
        } else {
          router.back();
        }
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
    if (!canCancel) {
      return;
    }
    router.back();
  };
  //#endregion

  //#region Image Picker state
  const [showImagePicker, setShowImagePicker] = useState(() => {
    if (cover) {
      return false;
    }
    if (coverTemplate?.data && viewer?.profile?.profileKind !== 'personal') {
      return false;
    }
    return true;
  });

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
      updateFields(
        [
          'mediaStyle',
          { ...data.mediaStyle, filter: data.mediaStyle?.filter ?? null },
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
    },
    [updateFields],
  );
  //#endregion

  const [currentTab, setCurrentTab] = useState<string>('models');

  const vp = useViewportSize();
  const intl = useIntl();

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

  if (!viewer) {
    return null;
  }

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.root,
          { paddingTop: vp`${insetTop}`, paddingBottom: vp`${insetBottom}` },
        ]}
        behavior="position"
      >
        <Header
          title={
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
          leftButton={
            !cropEditionMode && !isCreation ? (
              <Button
                disabled={!canCancel}
                variant="secondary"
                onPress={onCancel}
                label={intl.formatMessage({
                  defaultMessage: 'Cancel',
                  description: 'Cancel button label in cover edition screen',
                })}
              />
            ) : null
          }
          rightButton={
            cropEditionMode ? (
              <IconButton
                icon="rotate"
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
            editionParameters={editionParameters}
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
          />
          {sourceMedia && !cropEditionMode && (
            <FloatingIconButton
              icon="crop"
              variant="white"
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
          <FloatingIconButton
            icon="picture"
            variant="white"
            iconSize={24}
            onPress={onPickImage}
            style={[
              styles.takePictureButton,
              { top: (heighCover - ICON_SIZE) / 2 + PADDING_TOP_TOPPANEL },
            ]}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Select an image',
              description: 'Accessibility label of the image selection button',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage:
                'Press this button to select an image from your library',
              description: 'Accessibility hint of the image selection button',
            })}
          />
          <View style={styles.toolbar}>
            <Switch
              value={segmented ?? false}
              onValueChange={onToggleSegmentation}
              label={intl.formatMessage({
                defaultMessage: 'Clipping',
                description: 'Label of the clipping switch in cover edition',
              })}
              style={styles.toolbarElement}
              switchStyle={styles.switchStyle}
            />
            {currentTab !== 'models' && (
              <Switch
                value={merged ?? false}
                onValueChange={onToggleMerge}
                label={intl.formatMessage({
                  defaultMessage: 'Merge',
                  description: 'Label of the merge switch in cover edition',
                })}
                style={[styles.toolbarElement]}
                switchStyle={styles.switchStyle}
              />
            )}
          </View>
        </View>
        <View
          style={styles.bottomPanelContainer}
          onLayout={onBottomPanelLayout}
        >
          {editedParameter != null ? (
            <>
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
            </>
          ) : (
            <>
              {currentTab === 'models' && (
                <CoverModelsEditionPanel
                  viewer={viewer}
                  segmented={segmented ?? false}
                  sourceUri={imageSource?.uri}
                  mediaSize={sourceMediaSize}
                  title={title}
                  subTitle={subTitle}
                  selectedTemplateId={templateId}
                  onSelectTemplate={onSelectTemplate}
                />
              )}
              {currentTab === 'image' && (
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
                  style={styles.bottomPanel}
                />
              )}
              {currentTab === 'title' && (
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
                  style={styles.bottomPanel}
                />
              )}
              {currentTab === 'background' && (
                <CoverEditionBackgroundPanel
                  viewer={viewer}
                  background={backgroundId}
                  backgroundStyle={backgroundStyle}
                  onBackgroundChange={onBackgroundChange}
                  onBackgroundStyleChange={onBackgroundStyleChange}
                  bottomSheetHeights={bottomSheetHeights}
                  style={styles.bottomPanel}
                />
              )}
              {currentTab === 'foreground' && (
                <CoverEditionForegroundPanel
                  viewer={viewer}
                  foreground={foregroundId}
                  foregroundStyle={foregroundStyle}
                  onForegroundChange={onForegroundChange}
                  onForegroundStyleChange={onForegroundStyleChange}
                  bottomSheetHeights={bottomSheetHeights}
                  style={styles.bottomPanel}
                />
              )}
              <TabsBar
                variant="toolbar"
                currentTab={currentTab}
                onTabPress={setCurrentTab}
                iconSize={24}
                tabs={[
                  {
                    key: 'models',
                    icon: 'modelsCoverTemplate',
                    label: 'Models',
                  },
                  {
                    key: 'image',
                    icon: 'image',
                    label: 'Image edition',
                  },
                  {
                    key: 'title',
                    icon: 'title',
                    label: 'Title edition',
                  },
                  {
                    key: 'foreground',
                    icon: 'foreground',
                    label: 'Foreground selection',
                  },
                  {
                    key: 'background',
                    icon: 'background',
                    label: 'Background selection',
                  },
                ]}
                style={styles.tabsBar}
              />
            </>
          )}
        </View>
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
    </>
  );
};

export default CoverEditionScreen;
const { width } = Dimensions.get('window');
const PADDING_TOP_TOPPANEL = 20;
const ICON_SIZE = 50;
const styles = StyleSheet.create({
  switchStyle: { transform: [{ scaleX: 0.67 }, { scaleY: 0.71 }] },
  root: {
    backgroundColor: '#fff',
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  topPanel: {
    flex: 1,
    alignItems: 'center',
    paddingTop: PADDING_TOP_TOPPANEL,
  },
  topPanelContent: {
    flex: 1,
    aspectRatio: COVER_RATIO,
  },
  cropButton: {
    position: 'absolute',
    end: 20,
    shadowColor: colors.black,
    shadowOpacity: 0.35,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 4,
  },
  takePictureButton: {
    position: 'absolute',
    start: 20,
    shadowColor: colors.black,
    shadowOpacity: 0.35,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 4,
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
  bottomPanelContainer: {
    width: '100%',
    height: 324,
  },
  bottomPanel: {
    flex: 1,
    marginVertical: 10,
    marginBottom: TAB_BAR_HEIGHT,
  },
  tabsBar: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    width: width - 20,
    right: 10,
  },
  toolbar: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 100,
    backgroundColor: '#fff',
    shadowColor: colors.black,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
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
