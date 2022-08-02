import { useState } from 'react';
import { View, Platform } from 'react-native';
import { PhotoGallery } from 'react-native-photo-gallery-api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from '../../ui/IconButton';
import TextHeaderButton from '../../ui/TextHeaderButton';
import Header from '../Header';
import { exportImage } from './EditableImage';
import { exportVideo } from './EditableVideo';
import ImageEditor from './ImageEditor';
import ImageEditorPanel from './ImageEditorPanel';
import PhotoGalleryMediaList from './PhotoGalleryMediaList';
import useImageEditorState from './useImageEditorState';
import type { MediaInfo, MediaKind } from './helpers';
import type { PhotoIdentifier } from 'react-native-photo-gallery-api';

type ImagePickerProps = {
  imageRatio?: number;
  maxVideoDuration?: number;
  onPermissionRequestFailed: () => void;
  onClose: () => void;
  onMediaPicked: (media: {
    kind: Exclude<MediaKind, 'mixed'>;
    path: string;
  }) => void;
  kind?: MediaKind;
  imageSize?: { width: number; height: number };
};

const ImagePicker = ({
  imageRatio,
  maxVideoDuration,
  onPermissionRequestFailed,
  onClose,
  onMediaPicked,
  kind = 'picture',
}: ImagePickerProps) => {
  const [isEditStep, setIsEditStep] = useState(false);
  const [currentMediaInfos, setCurrentMediaInfos] = useState<MediaInfo | null>(
    null,
  );
  const {
    editedParameter,
    editionParameters,
    mediaFilter,
    timeRange,
    onTimeRangeChange,
    onStartEdition,
    onSaveEdition,
    onCancelEdition,
    updateOrientation,
    setParameterValue,
    setMediaFilter,
    reset,
  } = useImageEditorState(maxVideoDuration);

  const onNext = () => {
    setIsEditStep(true);
  };

  const onSelectMedia = async (media: PhotoIdentifier['node']) => {
    let filepath = media.image.uri;
    if (Platform.OS === 'ios') {
      const item = await PhotoGallery.iosGetImageDataById(
        media.image.uri,
        false,
      ).catch(() => null);
      filepath = item?.node.image.filepath ?? filepath;
    }
    setCurrentMediaInfos({
      assetUri: media.image.uri,
      kind: media.type === 'video' ? 'video' : 'picture',
      uri: filepath,
      playableDuration: media.image.playableDuration,
      width: media.image.width,
      height: media.image.height,
    });
    reset(media.type === 'video' ? media.image.playableDuration : null);
  };

  const onSave = () => {
    if (currentMediaInfos?.kind === 'picture') {
      exportImage({
        uri: currentMediaInfos.uri,
        size: { width: 1280 * imageRatio!, height: 1280 },
        filters: mediaFilter ? [mediaFilter] : [],
        parameters: editionParameters,
        format: 'JPEG',
        quality: 0.8,
      }).then(
        path => {
          onMediaPicked({ kind: 'picture', path });
        },
        e => {
          console.log(e);
        },
      );
    } else if (currentMediaInfos?.kind === 'video') {
      exportVideo({
        uri: currentMediaInfos.uri,
        size: { width: 960 * imageRatio!, height: 960 },
        filters: mediaFilter ? [mediaFilter] : [],
        parameters: editionParameters,
        removeSound: true,
        ...timeRange,
      }).then(
        path => {
          onMediaPicked({ kind: 'video', path });
        },
        e => {
          console.log(e);
        },
      );
    }
  };

  const { top: safeAreaTop, bottom: safeAreaBottom } = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: 'white',
        flex: 1,
        paddingTop: safeAreaTop,
      }}
    >
      <Header
        leftButton={<IconButton icon="chevron" onPress={onClose} />}
        rightButton={
          isEditStep ? (
            editedParameter === 'cropData' ? (
              currentMediaInfos?.kind === 'picture' ? (
                <IconButton icon="rotate" onPress={updateOrientation} />
              ) : null
            ) : !editedParameter ? (
              <TextHeaderButton text="OK" onPress={onSave} />
            ) : null
          ) : currentMediaInfos ? (
            <TextHeaderButton text="Next" onPress={onNext} />
          ) : null
        }
        title={
          isEditStep
            ? `Edit your ${currentMediaInfos?.kind}`
            : 'Select a picture or a video'
        }
      />
      <View
        style={{
          flex: 1,
          padding: 20,
        }}
      >
        {currentMediaInfos && (
          <ImageEditor
            style={{ flex: 1 }}
            aspectRatio={
              imageRatio ?? currentMediaInfos.width / currentMediaInfos.height
            }
            media={currentMediaInfos}
            editionParameters={editionParameters}
            cropEditionMode={editedParameter === 'cropData'}
            filters={mediaFilter ? [mediaFilter] : null}
            {...timeRange}
            onCropDataChange={cropData =>
              setParameterValue('cropData', cropData)
            }
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        {isEditStep ? (
          <ImageEditorPanel
            key={currentMediaInfos!.uri}
            mediaInfo={currentMediaInfos!}
            aspectRatio={
              imageRatio ?? currentMediaInfos!.width / currentMediaInfos!.height
            }
            timeRange={timeRange}
            mediaFilter={mediaFilter}
            editionParameters={editionParameters}
            editedParameter={editedParameter}
            onFilterChange={setMediaFilter}
            onStartEditing={onStartEdition}
            onTimeRangeChange={onTimeRangeChange}
            onSave={onSaveEdition}
            onCancel={onCancelEdition}
            setParameterValue={setParameterValue}
            style={{
              flex: 1,
              marginBottom: safeAreaBottom,
              marginTop: 20,
            }}
          />
        ) : (
          <PhotoGalleryMediaList
            selectedMediaURI={currentMediaInfos?.assetUri}
            onSelectMedia={onSelectMedia}
            kind={kind}
            contentContainerStyle={{ paddingBottom: safeAreaBottom }}
            onPermissionRequestFailed={onPermissionRequestFailed}
          />
        )}
      </View>
    </View>
  );
};

export default ImagePicker;
