import { useIntl } from 'react-intl';
import {
  COVER_MAX_MEDIA_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import ImagePicker, { SelectImageStep } from '#components/ImagePicker';
import ScreenModal from '#components/ScreenModal';
import useToggle from '#hooks/useToggle';
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import type { MediaInfo } from '#components/CoverEditor/coverEditorTypes';
import type { ImagePickerResult } from '#components/ImagePicker';

const CoverEditorAdjustTool = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);
  const {
    coverEditorState: { editionMode },
    dispatch,
  } = useCoverEditorContext();

  const activeMedia = useCoverEditorActiveMedia();
  const cropData = activeMedia?.editionParameters?.cropData;
  const media = activeMedia?.media;
  const mediaAspectRatio = cropData
    ? cropData.width / cropData.height
    : media
      ? media.width / media.height
      : 1;

  const onFinished = ({
    kind,
    uri,
    editionParameters,
    filter,
    rotation,
    height,
    width,
    timeRange,
    duration,
    galleryUri,
  }: ImagePickerResult) => {
    let mediaInfo: MediaInfo;
    if (kind === 'video') {
      mediaInfo = {
        media: {
          kind: 'video',
          uri,
          width,
          height,
          rotation,
          duration: duration!,
          galleryUri,
        },
        editionParameters,
        filter,
        timeRange: timeRange!,
      };
    } else {
      mediaInfo = {
        media: {
          kind: 'image',
          uri,
          width,
          height,
          galleryUri,
        },
        editionParameters,
        filter,
        duration: COVER_MAX_MEDIA_DURATION,
        animation: null,
      };
    }
    dispatch({
      type: 'UPDATE_ACTIVE_MEDIA',
      payload: mediaInfo,
    });

    toggleScreenModal();
  };

  return (
    <>
      <ToolBoxSection
        icon="refresh"
        label={intl.formatMessage({
          defaultMessage: 'Replace',
          description: 'Cover Edition Overlay Tool Button- Replace',
        })}
        onPress={toggleScreenModal}
      />
      {activeMedia != null && (
        <ScreenModal visible={show} animationType="slide">
          <ImagePicker
            initialData={activeMedia}
            kind={editionMode === 'overlay' ? 'image' : 'mixed'}
            forceAspectRatio={
              editionMode === 'overlay' ? mediaAspectRatio : COVER_RATIO
            }
            steps={[SelectImageStep]}
            onCancel={toggleScreenModal}
            onFinished={onFinished}
            maxVideoDuration={COVER_MAX_MEDIA_DURATION}
          />
        </ScreenModal>
      )}
    </>
  );
};

export default CoverEditorAdjustTool;

// import { memo, useCallback, useMemo, useState } from 'react';
// import { useIntl } from 'react-intl';
// import { Dimensions, View, StyleSheet } from 'react-native';
// import { colors } from '#theme';
// import {
//   CancelHeaderButton,
//   DoneHeaderButton,
// } from '#components/commonsButtons';
// import PhotoGalleryMediaList from '#components/PhotoGalleryMediaList';
// import ScreenModal from '#components/ScreenModal';
// import TransformedImageRenderer from '#components/TransformedImageRenderer';
// import TransformedVideoRenderer from '#components/TransformedVideoRenderer';
// import { useSkImage } from '#helpers/mediaEditions';
// import useToggle from '#hooks/useToggle';
// import Header from '#ui/Header';
// import SafeAreaView from '#ui/SafeAreaView';
// import {
//   useCoverEditorActiveMedia,
//   useCoverEditorContext,
// } from '../../CoverEditorContext';
// import ToolBoxSection from '../ui/ToolBoxSection';
// import type { Media } from '#helpers/mediaHelpers';
// import type { MediaInfoVideo } from '../../coverEditorTypes';

// const CoverEditorMediaReplace = () => {
//   const [show, toggleShowImagePicker] = useToggle(false);
//   const { dispatch, coverEditorState } = useCoverEditorContext();
//   const activeMedia = useCoverEditorActiveMedia();
//   const intl = useIntl();

//   //THIS IS SHIT in order to replace the selecte display without updating the active media
//   const [imageState, setImageState] = useState({
//     uri: activeMedia?.media.uri ?? '',
//     kind: activeMedia?.media.kind ?? 'image',
//     galleryUri: activeMedia?.media.galleryUri,
//     time:
//       activeMedia?.media.kind === 'video'
//         ? (activeMedia as MediaInfoVideo).timeRange?.startTime
//         : 0,
//     width: activeMedia?.media.width ?? 0,
//     height: activeMedia?.media.height ?? 0,
//     rotation: 0,
//   });
//   const dimensions = useMemo(() => {
//     if (!imageState) {
//       return null;
//     }
//     //from Nico, we are always showing the full image without crop or resize to apply edition parameters
//     const aspectRatio = imageState.width / imageState.height;

//     return aspectRatio > 1
//       ? { width: windowsWidth, height: windowsWidth / aspectRatio }
//       : { width: windowsWidth * aspectRatio, height: windowsWidth };
//   }, [imageState]);
//   const skImage = useSkImage(imageState);

//   const onMediaChange = useCallback((media: Media) => {
//     setImageState({
//       uri: media.uri,
//       kind: media.kind,
//       galleryUri: media.galleryUri,
//       time: media.kind === 'video' ? media.duration : 0,
//       width: media.width,
//       height: media.height,
//       rotation: 0,
//     });
//   }, []);

//   const onSave = useCallback(() => {
//     if (imageState.kind === 'video') {
//       dispatch({
//         type: 'UPDATE_ACTIVE_MEDIA',
//         payload: {
//           uri: imageState.uri!,
//           width: imageState.width!,
//           height: imageState.height!,
//           kind: 'video',
//           galleryUri: imageState.galleryUri,
//           duration: imageState.time,
//           rotation: 0,
//         },
//       });
//     } else if (imageState.kind === 'image') {
//       dispatch({
//         type: 'UPDATE_ACTIVE_MEDIA',
//         payload: {
//           uri: imageState.uri!,
//           width: imageState.width!,
//           height: imageState.height!,
//           kind: 'image',
//           galleryUri: imageState.galleryUri,
//         },
//       });
//     }

//     toggleShowImagePicker();
//   }, [dispatch, imageState, toggleShowImagePicker]);

//   return (
//     <>
//       <ToolBoxSection
//         icon="refresh"
//         label={intl.formatMessage({
//           defaultMessage: 'Replace',
//           description: 'Cover Edition Overlay Tool Button- Replace',
//         })}
//         onPress={toggleShowImagePicker}
//       />
//       <ScreenModal visible={show} animationType="slide">
//         <SafeAreaView style={{ flex: 1 }}>
//           <Header
//             leftElement={<CancelHeaderButton onPress={toggleShowImagePicker} />}
//             middleElement={intl.formatMessage({
//               defaultMessage: 'Select a media',
//               description: 'CoverEdition Replace Tool - Header Title',
//             })}
//             rightElement={<DoneHeaderButton onPress={onSave} />}
//           />
//           {dimensions && (
//             <View style={styles.imageContainer}>
//               {imageState.kind === 'video' ? (
//                 <TransformedVideoRenderer
//                   testID="image-picker-media-video"
//                   video={imageState}
//                   {...dimensions}
//                   startTime={
//                     (activeMedia as MediaInfoVideo).timeRange?.startTime ?? 0
//                   }
//                   duration={
//                     (activeMedia as MediaInfoVideo).timeRange?.duration ?? 15
//                   }
//                 />
//               ) : skImage != null ? (
//                 <TransformedImageRenderer
//                   testID="image-picker-media-image"
//                   image={skImage}
//                   {...dimensions}
//                 />
//               ) : null}
//             </View>
//           )}
//           <View style={styles.containerPanel}>
//             <PhotoGalleryMediaList
//               selectedMediaId={activeMedia?.media?.galleryUri}
//               album={null}
//               onMediaSelected={onMediaChange}
//               kind={
//                 coverEditorState.editionMode === 'overlay' ? 'image' : 'mixed'
//               }
//               autoSelectFirstItem={false}
//             />
//           </View>
//         </SafeAreaView>
//       </ScreenModal>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   containerPanel: { flex: 1 },
//   imageContainer: {
//     width: '100%',
//     aspectRatio: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: colors.grey500,
//     marginTop: 20,
//   },
//   filterSelectionStyle: { flex: 1, flexShrink: 0 },
//   editImageStepContentContainer: {
//     paddingHorizontal: 20,
//     maxHeight: 113,
//     alignSelf: 'center',
//   },
// });

// export default memo(CoverEditorMediaReplace);
// const windowsWidth = Dimensions.get('window').width;
