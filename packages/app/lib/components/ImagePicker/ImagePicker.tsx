import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import {
  iosReadGalleryPermission,
  iosRequestReadWriteGalleryPermission,
  PhotoGallery,
} from 'react-native-photo-gallery-api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../Header';
import IconButton from '../IconButton';
import TextHeaderButton from '../TextHeaderButton';
import { exportImage } from './EditableImage';
import { exportVideo } from './EditableVideo';
import ImageEditor from './ImageEditor';
import ImageEditorPanel from './ImageEditorPanel';
import ImagePickerMediaList from './ImagePickerMediaList';
import type { ImageEditionParameters, ImageOrientation } from './EditableImage';
import type { MediaInfo, MediaKind, TimeRange } from './helpers';
import type { PhotoIdentifier } from 'react-native-photo-gallery-api';

type ImagePickerProps = {
  imageRatio?: number;
  maxVideoDuration?: number;
  onAuthorizationFailed: () => void;
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
  onAuthorizationFailed,
  onClose,
  onMediaPicked,
  kind = 'picture',
}: ImagePickerProps) => {
  const [authorized, setAuthorized] = useState(false);
  const [isEditStep, setIsEditStep] = useState(false);
  const onAuthorizationFailedRef = useRef(onAuthorizationFailed);
  if (onAuthorizationFailed !== onAuthorizationFailedRef.current) {
    onAuthorizationFailedRef.current = onAuthorizationFailed;
  }

  useEffect(() => {
    let canceled = false;
    const fetchPermission = async () => {
      let permission = await iosReadGalleryPermission('readWrite');
      if (canceled) {
        return;
      }
      if (permission === 'granted' || permission === 'limited') {
        setAuthorized(true);
        return;
      }

      permission = await iosRequestReadWriteGalleryPermission();
      if (canceled) {
        return;
      }
      if (permission !== 'granted' && permission !== 'limited') {
        setAuthorized(true);
        return;
      }

      onAuthorizationFailedRef.current();
    };

    fetchPermission().catch(() => onAuthorizationFailedRef.current());
    return () => {
      canceled = true;
    };
  }, []);

  const [currentMediaInfos, setCurrentMediaInfos] = useState<MediaInfo | null>(
    null,
  );

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
    setEditParameters({});
    if (media.type === 'video') {
      setTimeRange({
        startTime: 0,
        duration:
          maxVideoDuration != null
            ? Math.min(media.image.playableDuration, maxVideoDuration)
            : media.image.playableDuration,
      });
    }
  };

  const [editionParameters, setEditParameters] =
    useState<ImageEditionParameters>({});
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);

  const previousParameters = useRef(editionParameters);
  const previousTimeRange = useRef(timeRange);
  const [currentEditedParams, setCurrentEditedParams] = useState<
    keyof ImageEditionParameters | null
  >(null);

  const onStartEdition = (param: keyof ImageEditionParameters) => {
    previousParameters.current = editionParameters;
    previousTimeRange.current = timeRange;
    setCurrentEditedParams(param);
  };

  function setParam<T extends keyof ImageEditionParameters>(
    key: T,
    value: ImageEditionParameters[T],
  ) {
    setEditParameters(params => ({ ...params, [key]: value }));
  }

  const ontTimeRangeChange = useCallback(
    (value: TimeRange) => {
      if (maxVideoDuration != null && value.duration > maxVideoDuration) {
        if (value.startTime === timeRange?.startTime) {
          value = {
            startTime: value.startTime + value.duration - maxVideoDuration,
            duration: maxVideoDuration,
          };
        } else {
          value = {
            startTime: value.startTime,
            duration: maxVideoDuration,
          };
        }
      }
      setTimeRange(value);
    },
    [maxVideoDuration, timeRange?.startTime],
  );

  const onSaveEdition = () => {
    previousParameters.current = editionParameters;
    previousTimeRange.current = timeRange;
    setCurrentEditedParams(null);
  };

  const onCancelEdition = () => {
    setEditParameters(previousParameters.current);
    setTimeRange(previousTimeRange.current);
    setCurrentEditedParams(null);
  };

  const updateOrientation = () => {
    let nextOrientation: ImageOrientation;
    switch (editionParameters.orientation) {
      case 'RIGHT':
        nextOrientation = 'DOWN';
        break;
      case 'DOWN':
        nextOrientation = 'LEFT';
        break;
      case 'LEFT':
        nextOrientation = 'UP';
        break;
      case 'UP':
      default:
        nextOrientation = 'RIGHT';
        break;
    }
    setParam('orientation', nextOrientation);
  };

  const onSave = () => {
    if (currentMediaInfos?.kind === 'picture') {
      exportImage({
        uri: currentMediaInfos.uri,
        size: { width: 1280 * imageRatio!, height: 1280 },
        filters: currentFilter ? [currentFilter] : [],
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
        filters: currentFilter ? [currentFilter] : [],
        parameters: editionParameters,
        removeSound: true,
        ...timeRange,
      }).then(
        path => {
          console.log(path);
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
            currentEditedParams ? (
              currentMediaInfos?.kind === 'picture' ? (
                <IconButton icon="rotate" onPress={updateOrientation} />
              ) : null
            ) : !currentEditedParams ? (
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
            cropEditionMode={currentEditedParams === 'cropData'}
            filters={currentFilter ? [currentFilter] : null}
            {...timeRange}
            onCropDataChange={cropData => setParam('cropData', cropData)}
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        {authorized ? (
          isEditStep ? (
            <ImageEditorPanel
              key={currentMediaInfos!.uri}
              mediaInfo={currentMediaInfos!}
              aspectRatio={
                imageRatio ??
                currentMediaInfos!.width / currentMediaInfos!.height
              }
              timeRange={timeRange}
              currentFilter={currentFilter}
              parameters={editionParameters}
              currentEditedParams={currentEditedParams}
              onFilterChange={setCurrentFilter}
              onStartEditing={onStartEdition}
              onTimeRangeChange={ontTimeRangeChange}
              onSave={onSaveEdition}
              onCancel={onCancelEdition}
              onParamChange={setParam}
              style={{
                flex: 1,
                marginBottom: safeAreaBottom,
                marginTop: 20,
              }}
            />
          ) : (
            <ImagePickerMediaList
              selectedMediaURI={currentMediaInfos?.assetUri}
              onSelectMedia={onSelectMedia}
              kind={kind}
              contentContainerStyle={{ paddingBottom: safeAreaBottom }}
            />
          )
        ) : (
          <ActivityIndicator />
        )}
      </View>
    </View>
  );
};

export default ImagePicker;
