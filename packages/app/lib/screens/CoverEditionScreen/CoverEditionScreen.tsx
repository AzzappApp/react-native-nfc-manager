import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import {
  COVER_MAX_HEIGHT,
  COVER_MAX_WIDTH,
  COVER_RATIO,
} from '@azzapp/shared/lib/cardHelpers';
import { typedEntries } from '@azzapp/shared/lib/objectHelpers';
import { combineLatest } from '@azzapp/shared/lib/observableHelpers';
import isEqual from 'lodash/isEqual';
import zip from 'lodash/zip';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Modal, StyleSheet, View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { colors } from '../../../theme';
import Header from '../../components/Header';
import ImageEditionFooter from '../../components/ImageEditionFooter';
import ImageEditionParameterControl from '../../components/ImageEditionParameterControl';
import ImagePicker, { SelectImageStep } from '../../components/ImagePicker';
import { getFileName, isFileURL } from '../../helpers/fileHelpers';
import { exportImage, segmentImage } from '../../helpers/mediaHelpers';
import useViewportSize, {
  insetBottom,
  insetTop,
} from '../../hooks/useViewportSize';
import { useRouter, useWebAPI } from '../../PlatformEnvironment';
import Button from '../../ui/Button';
import FloatingIconButton from '../../ui/FloatingIconButton';
import Icon from '../../ui/Icon';
import IconButton from '../../ui/IconButton';
import PressableNative from '../../ui/PressableNative';
import Switch from '../../ui/Switch';
import TabsBar from '../../ui/TabsBar';
import UploadProgressModal from '../../ui/UploadProgressModal';
import CoverEditionBackgroundPanel from './CoverEditionBackgroundPanel';
import CoverEditionForegroundPanel from './CoverEditionForegroundPanel';
import CoverEditionScreenCoverRenderer from './CoverEditionScreenCoverRenderer';
import CoverImageEditionPanel from './CoverImageEditionPanel';
import CoverTitleEditionPanel from './CoverTitleEditionPanel';
import type { ImagePickerResult } from '../../components/ImagePicker';
import type { EditableImageSource } from '../../components/medias';
import type {
  CropData,
  ImageEditionParameters,
  ImageOrientation,
} from '../../types';
import type { CoverEditionScreenCoverRendererHandle } from './CoverEditionScreenCoverRenderer';
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
import type { Observable } from 'relay-runtime';

export type CoverEditionScreenProps = {
  viewer: CoverEditionScreen_viewer$key | null;
};

const CoverEditionScreen = ({ viewer: viewerKey }: CoverEditionScreenProps) => {
  //#region Data dependencies
  const viewer = useFragment(
    graphql`
      fragment CoverEditionScreen_viewer on Viewer {
        ...CoverEditionBackgroundPanel_viewer
        ...CoverEditionForegroundPanel_viewer
        profile {
          userName
          firstName
          lastName
          companyName
          profileKind
          card {
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
  const cover = useFragment(
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
    (viewer?.profile?.card?.cover as CoverEditionScreen_cover$key | null) ??
      null,
  );

  //#endregion

  //#region Updates management
  const { firstName, lastName, companyName, profileKind } =
    viewer?.profile ?? {};
  const [updates, setUpdates] = useState<CoverEditionValue>(
    cover
      ? {}
      : {
          title:
            profileKind === 'personal'
              ? `${firstName} ${lastName}`
              : companyName,
        },
  );
  const updateFields = useCallback(
    <Key extends keyof CoverEditionValue>(
      ...entries: Array<[Key, CoverEditionValue[Key]]>
    ) => {
      setUpdates(updates => {
        updates = { ...updates };
        entries.forEach(([key, value]) => {
          switch (key) {
            case 'sourceMedia': {
              const media = value as {
                uri: string;
                width: number;
                height: number;
              };
              if (media?.uri === cover?.sourceMedia.id) {
                delete updates.sourceMedia;
              } else {
                updates.sourceMedia = value as any;
              }
              break;
            }
            case 'maskMedia':
              if (value === cover?.maskMedia.id) {
                delete updates.maskMedia;
              } else {
                updates.maskMedia = value as any;
              }
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

  //#region Displayed values computation
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
  const rendererRef = useRef<CoverEditionScreenCoverRendererHandle | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] =
    useState<Observable<number> | null>(null);

  const isCreation = !cover;
  const isDirty = Object.keys(updates).length > 0;
  const isValid =
    !isCreation || (updates.sourceMedia != null && updates.title != null);
  const canSave = !saving && isDirty && isValid;
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
          maskUri: segmented ? updates.maskMedia ?? cover?.maskMedia.uri : null,
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

    const textPreviewMediaPath =
      (shouldRecreateTextPreview && (await rendererRef.current?.capture())) ??
      null;

    const mediaToUploads = [
      mediaPath,
      textPreviewMediaPath,
      updates.sourceMedia?.uri, // TODO limit the size of the source media
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
    if (mediaInput) {
      input.media = mediaInput;
    }
    if (textPreviewMediaInput) {
      input.textPreviewMedia = textPreviewMediaInput;
    }
    if (sourceMediaInput) {
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
        if (isCreation) {
          router.replace({
            route: 'PROFILE',
            params: { userName: viewer!.profile!.userName },
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
  const [showImagePicker, setShowImagePicker] = useState(!cover);

  const onPickImage = () => {
    setShowImagePicker(true);
  };

  const onMediaSelected = ({
    uri,
    width,
    height,
    editionParameters,
  }: ImagePickerResult) => {
    updateFields(
      ['sourceMedia', { uri, width, height }],
      [
        'mediaStyle',
        {
          ...mediaStyle,
          parameters: editionParameters,
        },
      ],
    );
    setShowImagePicker(false);
  };

  const [maskComputing, setMaskComputing] = useState(false);
  useEffect(() => {
    let canceled = false;
    if (!maskMedia && sourceMedia && isFileURL(sourceMedia.uri)) {
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

  const [currentTab, setCurrentTab] = useState<string>('image');

  const vp = useViewportSize();
  const intl = useIntl();

  const cropEditionMode = editedParameter === 'roll';

  return (
    <>
      <View
        style={[
          styles.root,
          { paddingTop: vp`${insetTop}`, paddingBottom: vp`${insetBottom}` },
        ]}
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
            !cropEditionMode ? (
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
              <IconButton icon="rotate" onPress={onNextOrientation} />
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
          <CoverEditionScreenCoverRenderer
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
          />
          {sourceMedia && !cropEditionMode && (
            <FloatingIconButton
              icon="contrast"
              variant="white"
              onPress={onActivateCropMode}
              style={styles.cropButton}
            />
          )}
          <View style={styles.toolbar}>
            <PressableNative
              onPress={onPickImage}
              style={[styles.imageButton, styles.toolbarElement]}
            >
              <Icon icon="picture" style={styles.iconPicture} />
            </PressableNative>
            <Switch
              value={segmented ?? false}
              onValueChange={onToggleSegmentation}
              label={intl.formatMessage({
                defaultMessage: 'Clipping',
                description: 'Label of the clipping switch in cover edition',
              })}
              style={styles.toolbarElement}
            />
            <Switch
              value={merged ?? false}
              onValueChange={onToggleMerge}
              label={intl.formatMessage({
                defaultMessage: 'Merge',
                description: 'Label of the merge switch in cover edition',
              })}
              style={styles.toolbarElement}
            />
          </View>
        </View>
        <View style={styles.bottomPanelContainer}>
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
                  style={styles.bottomPanel}
                />
              )}
              {currentTab === 'background' && (
                <CoverEditionBackgroundPanel
                  viewer={viewer!}
                  background={backgroundId}
                  backgroundStyle={backgroundStyle}
                  onBackgroundChange={onBackgroundChange}
                  onBackgroundStyleChange={onBackgroundStyleChange}
                  style={styles.bottomPanel}
                />
              )}
              {currentTab === 'foreground' && (
                <CoverEditionForegroundPanel
                  viewer={viewer!}
                  foreground={foregroundId}
                  foregroundStyle={foregroundStyle}
                  onForegroundChange={onForegroundChange}
                  onForegroundStyleChange={onForegroundStyleChange}
                  style={styles.bottomPanel}
                />
              )}
              <TabsBar
                variant="toolbar"
                currentTab={currentTab}
                onTabPress={setCurrentTab}
                tabs={[
                  {
                    key: 'image',
                    icon: 'picture',
                    label: 'Image edition tab',
                  },
                  {
                    key: 'title',
                    icon: 'title',
                    label: 'Title edition tab',
                  },
                  {
                    key: 'foreground',
                    icon: 'foreground',
                    label: 'Effect edition tab',
                  },
                  {
                    key: 'background',
                    icon: 'background',
                    label: 'Effect edition tab',
                  },
                ]}
                style={styles.tabsBar}
              />
            </>
          )}
        </View>
      </View>
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
          canCancel={!!sourceMedia}
          steps={[SelectImageStep]}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topPanel: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  topPanelContent: {
    flex: 1,
    aspectRatio: COVER_RATIO,
  },
  cropButton: {
    position: 'absolute',
    top: 40,
    end: 20,
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
    flex: 1,
    marginBottom: 10,
  },
  bottomPanel: {
    flex: 1,
    marginVertical: 10,
  },
  tabsBar: {
    marginHorizontal: 10,
  },
  toolbar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 20,
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
  },
  toolbarElement: {
    marginRight: 10,
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
  sourceMedia?: { uri: string; width: number; height: number } | null;
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
