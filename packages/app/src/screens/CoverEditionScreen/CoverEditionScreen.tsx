import isEqual from 'lodash/isEqual';
import mapValues from 'lodash/mapValues';
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
import * as mime from 'react-native-mime-types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment, useMutation, readInlineData } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  COVER_MAX_HEIGHT,
  COVER_MAX_VIDEO_DURATTION,
  COVER_MAX_WIDTH,
  COVER_RATIO,
  COVER_SOURCE_MAX_IMAGE_DIMENSION,
  COVER_SOURCE_MAX_VIDEO_DIMENSION,
  COVER_VIDEO_BITRATE,
} from '@azzapp/shared/cardHelpers';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { useRouter, useWebAPI } from '#PlatformEnvironment';
import { colors } from '#theme';
import { exportImage, exportVideo } from '#components/gpu';
import ImageEditionFooter from '#components/ImageEditionFooter';
import ImageEditionParameterControl from '#components/ImageEditionParameterControl';
import ImagePicker from '#components/ImagePicker';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getFileName, isFileURL } from '#helpers/fileHelpers';
import { downScaleImage, isPNG, segmentImage } from '#helpers/mediaHelpers';
import BottomMenu, { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Button from '#ui/Button';
import Container from '#ui/Container';
import FloatingIconButton from '#ui/FloatingIconButton';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import SwitchLabel from '#ui/SwitchLabel';
import TabView from '#ui/TabView';

import UploadProgressModal from '#ui/UploadProgressModal';
import ViewTransition from '#ui/ViewTransition';
import CoverEditionBackgroundPanel from './CoverEditionBackgroundPanel';
import CoverEditionForegroundPanel from './CoverEditionForegroundPanel';
import CoverEditionImagePickerMediaWrapper from './CoverEditionImagePickerMediaWrapper';
import CoverEditionImagePickerSelectImageStep from './CoverEditionImagePickerSelectImageStep';
import CoverEditionVideoCropStep from './CoverEditionVideoCropStep';
import CoverImageEditionPanel from './CoverImageEditionPanel';
import CoverModelsEditionPanel from './CoverModelsEditionPanel';
import CoverPreviewRenderer from './CoverPreviewRenderer';
import CoverTitleEditionPanel from './CoverTitleEditionPanel';
import type {
  CropData,
  EditionParameters,
  ImageOrientation,
} from '#components/gpu';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { FooterBarItem } from '#ui/FooterBar';
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
        segmentedTemplatesCategories: coverTemplatesByCategory(
          segmented: true
        ) {
          ...CoverModelsEditionPanel_categories
          templates {
            id
            ...CoverEditionScreen_template
          }
        }
        unsegmentedTemplatesCategories: coverTemplatesByCategory(
          segmented: false
        ) {
          ...CoverModelsEditionPanel_categories
          templates {
            id
            ...CoverEditionScreen_template
          }
        }
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
          __typename
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

  const initialTemplate = useMemo(() => {
    const categories =
      profileKind === 'personal'
        ? viewer?.segmentedTemplatesCategories
        : viewer?.unsegmentedTemplatesCategories;
    return categories?.[0]?.templates[0] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [updates, setUpdates] = useState<CoverEditionValue>(() => {
    if (cover) {
      return {};
    }
    const isPersonal = profileKind === 'personal';
    const updatesValue: CoverEditionValue = {
      title: isPersonal ? `${firstName} ${lastName}`.trim() : companyName,
      segmented: isPersonal,
      subTitle: !isPersonal
        ? viewer?.profile?.companyActivity?.label
        : undefined,
    };
    if (initialTemplate) {
      // can't understand why, but the compiler doesn't infer the type correctly
      const { data } = readInlineData<CoverEditionScreen_template$key>(
        templateDataFragment,
        initialTemplate,
      );
      Object.assign(updatesValue, {
        mediaStyle: data.mediaStyle,
        backgroundId: data.background?.id ?? null,
        foregroundId: data.foreground?.id ?? null,
        contentStyle: data.contentStyle,
        backgroundStyle: data.backgroundStyle ?? null,
        foregroundStyle: data.foregroundStyle ?? null,
        merged: data.merged,
        segmented: data.segmented,
        subTitleStyle: data.subTitleStyle ?? null,
        titleStyle: data.titleStyle,
        // will be erased by demo asset in personal profile case
        sourceMedia: { ...data.sourceMedia, kind: 'image' },
      });
    }

    if (isPersonal) {
      const assetDemo = Image.resolveAssetSource(
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('#assets/demo_asset.png'),
      );

      updatesValue.sourceMedia = {
        uri: assetDemo.uri,
        kind: 'image',
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
      sourceMedia: firstNotUndefined(
        updates.sourceMedia,
        cover?.sourceMedia
          ? {
              kind:
                cover.sourceMedia.__typename === 'MediaVideo'
                  ? 'video'
                  : 'image',
              uri: cover.sourceMedia.uri,
              width: cover.sourceMedia.width,
              height: cover.sourceMedia.height,
            }
          : undefined,
      ),
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

  const kind = sourceMedia?.kind ?? 'image';
  const uri = sourceMedia?.uri;
  const maskUri = segmented ? maskMedia : null;
  const backgroundUri =
    viewer?.coverBackgrounds.find(background => background.id === backgroundId)
      ?.uri ?? null;
  const foregroundUri =
    viewer?.coverForegrounds.find(foreground => foreground.id === foregroundId)
      ?.uri ?? null;
  const mediaSize = useMemo(() => {
    if (sourceMedia) {
      return {
        width: sourceMedia.width,
        height: sourceMedia.height,
      };
    }
    return null;
  }, [sourceMedia]);

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

    const renderer = rendererRef.current;
    if (!renderer) {
      //Todo: handle error
      return;
    }

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
      ? await renderer.exporteMedia({
          width: COVER_MAX_WIDTH,
          height: COVER_MAX_HEIGHT,
        })
      : null;

    const shouldRecreateTextPreview =
      updates.title != null ||
      updates.contentStyle != null ||
      updates.titleStyle != null ||
      updates.subTitle != null ||
      updates.subTitleStyle != null;

    const textPreviewMediaPath = shouldRecreateTextPreview
      ? await renderer.exportTextMedia()
      : null;

    const sourceMediaId = sourceMedia?.id;
    const shouldRecreateSourceMedia = updates.sourceMedia && !sourceMediaId;

    const mediaToUploads: Array<{
      uri: string;
      kind: 'image' | 'video';
    } | null> = [
      mediaPath ? { uri: `file://${mediaPath}`, kind } : null,
      textPreviewMediaPath
        ? { uri: `file://${textPreviewMediaPath}`, kind: 'image' }
        : null,
      shouldRecreateSourceMedia && updates.sourceMedia?.uri
        ? { uri: updates.sourceMedia.uri, kind }
        : null,
      updates.maskMedia ? { uri: updates.maskMedia, kind: 'image' } : null,
    ];

    let uploadInfos: Array<{
      uploadURL: string;
      uploadParameters: Record<string, any>;
    } | null>;

    try {
      uploadInfos = await Promise.all(
        mediaToUploads.map(media =>
          media ? uploadSign({ kind: media.kind, target: 'cover' }) : null,
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
        const fileName = getFileName(media.uri);
        return {
          ...uploadMedia(
            {
              name: fileName,
              uri: media.uri,
              type:
                mime.lookup(fileName) || kind === 'image'
                  ? 'image/jpg'
                  : 'video/mp4',
            } as any,
            uploadURL,
            uploadParameters,
          ),
          kind: media.kind,
        };
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
            upload?.promise.then(uploadResult => ({
              id: uploadResult.public_id as string,
              width: uploadResult.width as number,
              height: uploadResult.height as number,
              kind: upload.kind,
            })),
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
  const [sourceMediaComputing, setSourceMediaComputing] = useState(false);

  const onPickImage = () => {
    setShowImagePicker(true);
  };

  const onMediaSelected = async ({
    uri,
    kind,
    width,
    height,
    editionParameters,
    timeRange,
  }: ImagePickerResult) => {
    const media = { kind, width, height, uri };
    const parameters = { ...editionParameters };
    const maxSize =
      kind === 'image'
        ? COVER_SOURCE_MAX_IMAGE_DIMENSION
        : COVER_SOURCE_MAX_VIDEO_DIMENSION;

    setIsDemoAsset(false);
    setShowImagePicker(false);

    if (
      width > maxSize ||
      height > maxSize ||
      timeRange != null
      // TODO the bitrate/framerate of the video might be too high perhaps we should also check that
    ) {
      const newSize = downScaleImage(width, height, maxSize);

      updateFields(['sourceMedia', null]);
      setSourceMediaComputing(true);
      const resizePath =
        kind === 'image'
          ? await exportImage({
              layers: [{ kind: 'image', uri }],
              size: newSize,
              format: isPNG(uri) ? 'PNG' : 'JPEG',
            })
          : await exportVideo({
              layers: [
                {
                  kind: 'video',
                  uri,
                  startTime: timeRange?.startTime,
                  duration: timeRange?.duration,
                },
              ],
              size: newSize,
              bitRate: COVER_VIDEO_BITRATE,
            });
      setSourceMediaComputing(false);

      media.width = newSize.width;
      media.height = newSize.height;
      media.uri = `file://${resizePath}`;

      const scale = newSize.width / width;
      //don't forget to update the crop data
      if (parameters.cropData) {
        parameters.cropData = mapValues(parameters.cropData, v => v * scale);
      }
    }

    updateFields(
      ['sourceMedia', media],
      ['mediaStyle', { ...mediaStyle, parameters }],
      ['segmented', segmented && kind === 'image'],
      ['maskMedia', null],
    );
  };

  useEffect(() => {
    let canceled = false;
    if (sourceMedia && isFileURL(sourceMedia.uri) && kind === 'image') {
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
    setShowImagePicker(false);
  };
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
    keyof EditionParameters | null
  >(null);

  const editionParameters = useMemo<EditionParameters>(
    () => (mediaStyle && (mediaStyle.parameters as EditionParameters)) ?? {},
    [mediaStyle],
  );

  const editionParametersSave = useRef(editionParameters);
  const onStartParameterEdition = (param: keyof EditionParameters) => {
    editionParametersSave.current = editionParameters;
    setEditedParameter(param);
  };

  const onParameterValueChange = useCallback(
    <T extends keyof EditionParameters>(
      param: T,
      value: EditionParameters[T],
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
        nextOrientation = 'UP';
        break;
      case 'DOWN':
        nextOrientation = 'LEFT';
        break;
      case 'RIGHT':
        nextOrientation = 'DOWN';
        break;
      case 'UP':
      default:
        nextOrientation = 'RIGHT';
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

  //#region Foreground
  const onForegroundChange = (foregroundId: string | null) => {
    updateFields(['foregroundId', foregroundId]);
  };
  const onForegroundStyleChange = (style: CardCoverForegroundStyleInput) => {
    updateFields(['foregroundStyle', style]);
  };
  //#endregion

  //#region Template selection

  const categories = segmented
    ? viewer?.segmentedTemplatesCategories
    : viewer?.unsegmentedTemplatesCategories;

  const [templateId, setTemplateId] = useState<string | null>(
    initialTemplate?.id ?? null,
  );

  const onSelectTemplate = useCallback(
    (templateId: string) => {
      setTemplateId(templateId);
      if (!categories) {
        return;
      }
      let template: CoverEditionScreen_template$key | null = null;
      for (const category of categories) {
        for (const categoryTemplate of category.templates) {
          if (categoryTemplate.id === templateId) {
            template = categoryTemplate;
            break;
          }
        }
        if (template) {
          break;
        }
      }

      if (!template) {
        return;
      }
      const { data } = readInlineData(templateDataFragment, template);
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
        updateFields([
          'sourceMedia',
          {
            ...data.sourceMedia,
            kind: 'image',
          },
        ]);
      }
    },
    [
      categories,
      editionParameters.cropData,
      editionParameters.orientation,
      updateFields,
      isCreation,
      profileKind,
      updates.sourceMedia?.id,
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

  const [coverHeight, setCoverHeight] = useState<number | null>(null);
  const onCoverLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setCoverHeight(layout.height);
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
  const navigateToPanel = useCallback((menu: string) => {
    setCurrentTab(menu);
  }, []);

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
        <ViewTransition
          style={[styles.topPanel, { opacity: coverHeight != null ? 1 : 0 }]}
          transitionDuration={120}
          transitions={['opacity']}
        >
          <PressableNative
            style={{ flex: 1 }}
            onPress={onPickImage}
            disabled={cropEditionMode}
            disabledOpacity={1}
          >
            <CoverPreviewRenderer
              ref={rendererRef}
              kind={kind}
              uri={uri}
              maskUri={maskUri}
              mediaSize={mediaSize}
              foregroundImageUri={foregroundUri}
              foregroundImageTintColor={
                cropEditionMode
                  ? makeTranslucent(foregroundStyle?.color)
                  : foregroundStyle?.color
              }
              backgroundImageUri={backgroundUri}
              backgroundColor={backgroundStyle?.backgroundColor}
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
              computing={(segmented && maskComputing) || sourceMediaComputing}
              cropEditionMode={cropEditionMode}
              onCropDataChange={onCropDataChange}
              onLayout={onCoverLayout}
              style={appearanceStyle.coverShadow}
            />
          </PressableNative>
          {sourceMedia && !cropEditionMode && (
            <FloatingIconButton
              icon="crop"
              iconSize={24}
              onPress={onActivateCropMode}
              style={[
                styles.cropButton,
                coverHeight != null && {
                  top: (coverHeight - ICON_SIZE) / 2 + PADDING_TOP_TOPPANEL,
                },
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
                coverHeight != null && {
                  top: (coverHeight - ICON_SIZE) / 2 + PADDING_TOP_TOPPANEL,
                },
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
            {kind !== 'video' && (
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
            )}
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
          </View>
        </ViewTransition>

        <TabView
          currentTab={currentTab}
          tabs={[
            {
              id: 'models',
              element: (
                <CoverModelsEditionPanel
                  categories={categories!}
                  uri={uri}
                  kind={kind}
                  maskUri={maskUri}
                  title={title}
                  subTitle={subTitle}
                  selectedTemplateId={templateId}
                  onSelectTemplate={onSelectTemplate}
                  isCreation={isCreation}
                  editionParameters={editionParameters}
                />
              ),
            },
            {
              id: 'image',
              element: (
                <CoverImageEditionPanel
                  uri={uri}
                  kind={kind}
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
              ),
            },
            {
              id: 'title',
              element: (
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
              ),
            },
            {
              id: 'foreground',
              element: (
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
              ),
            },
            {
              id: 'background',
              element: (
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
              ),
            },
          ]}
          onLayout={onBottomPanelLayout}
          style={{ minHeight: MINIMAL_BOTTOM_HEIGHT, flex: 1 }}
        />
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
          kind="mixed"
          forceAspectRatio={COVER_RATIO}
          maxVideoDuration={COVER_MAX_VIDEO_DURATTION}
          onFinished={onMediaSelected}
          onCancel={onImagePickerCancel}
          steps={[
            CoverEditionImagePickerSelectImageStep,
            CoverEditionVideoCropStep,
          ]}
          TopPanelWrapper={CoverEditionImagePickerMediaWrapper}
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

const templateDataFragment = graphql`
  fragment CoverEditionScreen_template on CoverTemplate @inline {
    data {
      mediaStyle
      sourceMedia {
        id
        uri
        width
        height
      }
      background {
        id
      }
      backgroundStyle {
        backgroundColor
        patternColor
      }
      foreground {
        id
      }
      foregroundStyle {
        color
      }
      segmented
      merged
      contentStyle {
        orientation
        placement
      }
      titleStyle {
        fontFamily
        fontSize
        color
      }
      subTitleStyle {
        fontFamily
        fontSize
        color
      }
    }
  }
`;

type CoverEditionValue = {
  sourceMedia?: {
    id?: string;
    kind: 'image' | 'video';
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
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
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
