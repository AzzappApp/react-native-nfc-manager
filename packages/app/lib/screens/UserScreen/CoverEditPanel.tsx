import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import {
  DEFAULT_CARD_COVER,
  COVER_RATIO,
  COVER_MAX_VIDEO_DURATTION,
} from '@azzapp/shared/lib/cardHelpers';
import clamp from 'lodash/clamp';
import isEqual from 'lodash/isEqual';
import omitBy from 'lodash/omitBy';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { Observable } from 'relay-runtime';
import { QR_CODE_POSITION_CHANGE_EVENT } from '../../components/CoverRenderer/CoverRenderer';
import ImagePicker from '../../components/ImagePicker';
import { addCacheEntry } from '../../components/MediaRenderer/MediaImageRenderer';
import { addLocalVideo } from '../../components/MediaRenderer/MediaVideoRenderer';
import useFormMutation from '../../hooks/useFormMutation';
import { useWebAPI } from '../../PlatformEnvironment';
import ColorPicker from '../../ui/ColorPicker';
import TabsBar from '../../ui/TabsBar';
import CoverEditPanelEffectTab from './CoverEditPanelEffectTab';
import CoverEditPanelImageTab from './CoverEditPanelImageTab';
import CoverEditPanelTitleTab from './CoverEditPanelTitleTab';
import ModuleEditorContext from './ModuleEditorContext';
import UploadProgressModal from './UploadProgressModal';
import type { CoverEditPanel_cover$key } from '@azzapp/relay/artifacts/CoverEditPanel_cover.graphql';
import type {
  CoverEditPanelMutation,
  MediaKind,
  UpdateCoverInput,
} from '@azzapp/relay/artifacts/CoverEditPanelMutation.graphql';
import type { EventEmitter } from 'events';
import type { StyleProp, ViewStyle, LayoutChangeEvent } from 'react-native';

type CoverEditPanelProps = {
  userId: string;
  cover?: CoverEditPanel_cover$key | null;
  cardId?: string;
  imageIndex: number | undefined;
  setImageIndex: (index: number | undefined) => void;
  eventEmitter?: EventEmitter;
  style?: StyleProp<ViewStyle>;
};

export type CoverUpdates = Omit<UpdateCoverInput, 'pictures'> & {
  pictures?: Array<
    | {
        kind: MediaKind;
        source: { uri: string; file: any };
      }
    | {
        readonly __typename: string;
        readonly ratio: number;
        readonly source: string;
        readonly thumbnail?: string;
        readonly uri: string;
      }
  >;
};

const CoverEditPanel = ({
  userId,
  cover: coverKey,
  cardId,
  imageIndex,
  setImageIndex,
  eventEmitter,
  style,
}: CoverEditPanelProps) => {
  const cover = useFragment(
    graphql`
      fragment CoverEditPanel_cover on UserCardCover
      @argumentDefinitions(
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
      ) {
        backgroundColor
        pictures {
          __typename
          source
          ratio
          uri(width: $screenWidth, pixelRatio: $pixelRatio)
          ... on MediaVideo {
            thumbnail(width: $screenWidth, pixelRatio: $pixelRatio)
          }
        }
        pictureTransitionTimer
        overlayEffect
        title
        titlePosition
        titleFont
        titleFontSize
        titleColor
        titleRotation
        qrCodePosition
        desktopLayout
        dektopImagePosition
      }
    `,
    coverKey ?? null,
  );

  const initialData = useMemo(
    () => cover,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const coverUpdatesRef = useRef<CoverUpdates>({});

  const { commit, revert, applyOptimistic } =
    useFormMutation<CoverEditPanelMutation>(graphql`
      mutation CoverEditPanelMutation($input: UpdateCoverInput!) {
        updateCover(input: $input) {
          user {
            id
            card {
              cover {
                ...CoverEditPanel_cover
              }
            }
          }
        }
      }
    `);

  const moduleEditor = useContext(ModuleEditorContext)!;

  const applyUpdates = (updates: Partial<CoverUpdates>) => {
    const coverUpdates: CoverUpdates = omitBy(
      { ...coverUpdatesRef.current, ...updates },
      (val, key) => isEqual((initialData as any)?.[key], val),
    );

    if (isEqual(coverUpdates, coverUpdatesRef.current)) {
      return;
    }
    coverUpdatesRef.current = coverUpdates;

    const isDirty = !!Object.keys(coverUpdates).length;

    const pictures = coverUpdates.pictures ?? initialData?.pictures;
    const title = coverUpdates.title ?? initialData?.title;
    const isValid = !!pictures?.length && !!title;

    moduleEditor.setCanSave(isDirty && isValid);

    if (isDirty) {
      applyOptimistic(
        getOptimisticResponse(initialData, coverUpdates, userId, cardId),
      );
    } else {
      revert();
    }
  };

  const WebAPI = useWebAPI();

  const [uploadProgress, setUploadProgress] =
    useState<Observable<number> | null>(null);

  const onSave = useCallback(async () => {
    const { pictures, ...coverUpdates } = coverUpdatesRef.current;

    const updateCoverInput: UpdateCoverInput = coverUpdates;
    try {
      if (pictures) {
        const picturesToUpload: Array<{
          kind: MediaKind;
          index: number;
          file: any;
        }> = [];
        pictures.forEach((picture, index) => {
          if ('kind' in picture) {
            picturesToUpload.push({
              kind: picture.kind,
              file: picture.source.file,
              index,
            });
          }
        });

        if (picturesToUpload.length) {
          const uploadSettings = await Promise.all(
            picturesToUpload.map(({ kind }) =>
              WebAPI.uploadSign({
                kind: kind as any,
                target: 'cover',
              }),
            ),
          );

          const uploads = picturesToUpload.map(({ file, kind, index }, i) => {
            const { uploadURL, uploadParameters } = uploadSettings[i];
            return {
              index,
              upload: WebAPI.uploadMedia(file, uploadURL, uploadParameters),
              kind,
              localURI: file.uri,
            };
          });

          const nbObservables = uploads.length;
          if (nbObservables) {
            const totals: number[] = uploads.map(() => 0);
            setUploadProgress(
              Observable.create(sink => {
                sink.next(0);
                const subscriptions = uploads.map(
                  ({ upload: { progress } }, index) =>
                    progress.subscribe({
                      next: value => {
                        totals[index] = value;
                        sink.next(
                          totals.reduce(
                            (value: number, uploadValue: number) =>
                              value + uploadValue / nbObservables,
                            0,
                          ),
                        );
                      },
                    }),
                );

                return () => {
                  subscriptions.forEach(subscription => {
                    subscription.unsubscribe();
                  });
                };
              }),
            );
          }

          const results = await Promise.all(
            uploads.map(({ upload, kind, localURI, index }) =>
              upload.promise.then(res => ({
                index,
                kind,
                publicId: res.public_id as string,
                localURI,
              })),
            ),
          );

          results.forEach(({ publicId, kind, localURI }) => {
            if (kind === 'picture') {
              // TODO arbitrary size
              addCacheEntry(publicId, 1600, localURI);
            } else {
              addLocalVideo(publicId, localURI);
            }
          });

          updateCoverInput.pictures = pictures.map((picture, index) => {
            const uploadedImage = results.find(
              result => result.index === index,
            );
            if ('kind' in picture) {
              return {
                kind: picture.kind,
                source: uploadedImage!.publicId,
              };
            } else {
              return {
                kind: picture.__typename === 'MediaImage' ? 'picture' : 'video',
                source: picture.source,
              };
            }
          });
        } else {
          updateCoverInput.pictures = convertToNonNullArray(
            pictures.map(picture => {
              if ('kind' in picture) {
                console.error('Illogical case in mutation');
                return null;
              }
              return {
                kind: picture.__typename === 'MediaImage' ? 'picture' : 'video',
                source: picture.source,
              };
            }),
          );
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Error');
      console.log(e);
      moduleEditor.onSaveError(e as Error);
      return;
    }
    setUploadProgress(null);
    commit({
      variables: { input: updateCoverInput },
      optimisticResponse: getOptimisticResponse(
        initialData,
        coverUpdatesRef.current,
        userId,
        cardId,
      ),
      onCompleted() {
        moduleEditor.onSaved();
      },
      onError(e) {
        // eslint-disable-next-line no-alert
        alert('Error');
        console.log(e);
        moduleEditor.onSaveError(e);
      },
    });
  }, [WebAPI, cardId, commit, initialData, moduleEditor, userId]);

  const onCancel = useCallback(() => {
    revert();
  }, [revert]);

  useEffect(() => {
    const saveSubscription = moduleEditor.setSaveListener(onSave);
    const cancelSubscription = moduleEditor.setCancelListener(onCancel);

    return () => {
      saveSubscription.dispose();
      cancelSubscription.dispose();
    };
  }, [moduleEditor, onSave, onCancel]);

  useEffect(() => revert, [revert]);

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [editedIndex, setEditedIndex] = useState(-1);

  const onSelectPicture = (index: number | undefined) => {
    if (index === undefined || cover?.pictures[index]) {
      setImageIndex(index);
      return;
    }
    setEditedIndex(index);
    setShowImagePicker(true);
  };

  const onMediaPicked = ({
    path,
    kind,
  }: {
    path: string;
    kind: 'image' | 'video';
  }) => {
    const coverUpdates = coverUpdatesRef.current;
    const pictures = [
      ...(coverUpdates.pictures ?? initialData?.pictures ?? []),
    ];
    const index = Math.min(editedIndex, pictures.length);

    pictures[index] = {
      kind: kind === 'video' ? 'video' : 'picture',
      source: {
        uri: `file://${path}`,
        file: {
          name: getFileName(path),
          uri: `file://${path}`,
          type: kind === 'image' ? 'image/jpeg' : 'video/quicktime',
        },
      },
    };
    applyUpdates({ pictures });
    setImageIndex(index);
    setShowImagePicker(false);
  };

  const onImagePickCancel = () => {
    setEditedIndex(-1);
    setShowImagePicker(false);
  };

  const onRemovePicture = () => {
    if (imageIndex === undefined) {
      return;
    }
    const coverUpdates = coverUpdatesRef.current;
    const pictures = [
      ...(coverUpdates.pictures ?? initialData?.pictures ?? []),
    ];
    pictures.splice(imageIndex, 1);
    applyUpdates({ pictures });
    setImageIndex(clamp(imageIndex, 0, pictures.length - 1));
  };

  const onUpdatePicture = () => {
    setEditedIndex(imageIndex ?? 0);
    setShowImagePicker(true);
  };

  const updateField = <T extends keyof CoverUpdates>(
    key: T,
    value: CoverUpdates[T],
  ) => {
    applyUpdates({ [key]: value });
  };

  const updateFieldRef = useRef(updateField);
  updateFieldRef.current = updateField;
  useEffect(() => {
    const handler = (position: string) => {
      updateFieldRef.current('qrCodePosition', position);
    };

    eventEmitter?.on(QR_CODE_POSITION_CHANGE_EVENT, handler);

    return () => {
      eventEmitter?.off(QR_CODE_POSITION_CHANGE_EVENT, handler);
    };
  }, [eventEmitter]);

  const [currenTab, setCurrentTab] = useState('picture');

  const displayedCover = {
    pictures: [],
    title: '',
    ...DEFAULT_CARD_COVER,
    ...cover,
  };

  const [showColorPicker, setShowColorPicker] = useState(false);

  const onTabPress = (tab: string) => {
    if (tab === 'color-picker') {
      setShowColorPicker(true);
      return;
    }
    setImageIndex(0);
    setCurrentTab(tab);
  };

  const [bottomSheetHeights, setBottomSheetsHeight] = useState<number>(0);

  const onLayout = (e: LayoutChangeEvent) =>
    setBottomSheetsHeight(e.nativeEvent.layout.height);

  return (
    <>
      <View style={[styles.container, style]} onLayout={onLayout}>
        {currenTab === 'picture' && (
          <CoverEditPanelImageTab
            pictures={displayedCover.pictures}
            timer={displayedCover.pictureTransitionTimer}
            imageIndex={imageIndex}
            onSelectPicture={onSelectPicture}
            onRemovePicture={onRemovePicture}
            onUpdatePicture={onUpdatePicture}
            onUpdatTimer={timer => updateField('pictureTransitionTimer', timer)}
            style={styles.tab}
          />
        )}
        {currenTab === 'title' && (
          <CoverEditPanelTitleTab
            title={displayedCover.title}
            titleColor={displayedCover.titleColor}
            titleFont={displayedCover.titleFont}
            titleFontSize={displayedCover.titleFontSize}
            titleRotation={displayedCover.titleRotation}
            titlePosition={displayedCover.titlePosition}
            updateField={updateField}
            style={styles.tab}
            bottomSheetHeights={bottomSheetHeights}
          />
        )}
        {currenTab === 'effect' && (
          <CoverEditPanelEffectTab
            overlayEffect={displayedCover.overlayEffect}
            updateField={updateField}
            style={styles.tab}
          />
        )}
        <TabsBar
          currentTab={currenTab}
          tabs={[
            {
              key: 'picture',
              accessibilityLabel: 'Picture Tab',
              icon: 'picture',
            },
            {
              key: 'title',
              accessibilityLabel: 'Title Tab',
              icon: 'title',
            },
            {
              key: 'effect',
              accessibilityLabel: 'Effect Tab',
              icon: 'effect',
            },
            {
              key: 'color-picker',
              accessibilityLabel: 'Effect Tab',
              icon: 'color-picker',
              tint: false,
            },
            {
              key: 'desktop',
              accessibilityLabel: 'Desktop Tab',
              icon: 'desktop',
            },
          ]}
          onTabPress={onTabPress}
        />
      </View>
      <ColorPicker
        title="Background color"
        visible={showColorPicker}
        onRequestClose={() => setShowColorPicker(false)}
        initialValue={displayedCover.backgroundColor}
        onChange={value => updateField('backgroundColor', value)}
        height={bottomSheetHeights}
      />
      <UploadProgressModal
        visible={!!uploadProgress}
        progressIndicator={uploadProgress}
      />
      <Modal
        visible={showImagePicker}
        animationType="slide"
        onRequestClose={onImagePickCancel}
      >
        <ImagePicker
          forceAspectRatio={COVER_RATIO}
          onFinished={onMediaPicked}
          onCancel={onImagePickCancel}
          maxVideoDuration={COVER_MAX_VIDEO_DURATTION}
        />
      </Modal>
    </>
  );
};

export default CoverEditPanel;

const styles = StyleSheet.create({
  container: { flex: 1 },
  tab: { flex: 1, marginTop: 20 },
});

const getOptimisticResponse = (
  intialData: any,
  coverUpdates: CoverUpdates,
  userId: string,
  cardId?: string,
) => ({
  updateCover: {
    user: {
      id: userId,
      card: {
        id: cardId ?? `tmp-${userId}-mainCard`,
        cover: {
          ...DEFAULT_CARD_COVER,
          ...intialData,
          ...coverUpdates,
          title: coverUpdates.title ?? intialData?.title ?? '',
          pictures: coverUpdates.pictures
            ? coverUpdates.pictures?.map(picture => {
                if ('__typename' in picture) {
                  return picture;
                }
                if (picture.kind === 'video') {
                  return {
                    __typename: 'MediaVideo',
                    source: picture.source.uri,
                    uri: picture.source.uri,
                    thumbnail: '',
                    ratio: COVER_RATIO,
                  };
                } else {
                  return {
                    __typename: 'MediaImage',
                    source: picture.source.uri,
                    uri: picture.source.uri,
                    ratio: COVER_RATIO,
                  };
                }
              })
            : intialData?.pictures ?? [],
        },
      },
    },
  },
});

const getFileName = (path: string) => {
  const arr = path.split('/');
  return arr[arr.length - 1];
};
