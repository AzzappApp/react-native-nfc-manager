import { useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { PhotoGallery } from 'react-native-photo-gallery-api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useMutation } from 'react-relay';
import { colors } from '../../../theme';
import Header from '../../components/Header';
import exportMedia from '../../components/ImageEditions/exportMedia';
import ImageEditor from '../../components/ImageEditions/ImageEditor';
import ImageEditorPanel from '../../components/ImageEditions/ImageEditorPanel';
import PhotoGalleryMediaList from '../../components/ImageEditions/PhotoGalleryMediaList';
import useImageEditorState from '../../components/ImageEditions/useImageEditorState';
import { useRouter, useWebAPI } from '../../PlatformEnvironment';
import IconButton from '../../ui/IconButton';
import TextHeaderButton from '../../ui/TextHeaderButton';
import UploadProgressModal from '../UserScreen/UploadProgressModal';
import PostContentPanel from './PostContentPanel';
import type { MediaInfo } from '../../components/ImageEditions/helpers';
import type { PostCreationScreenMutation } from '@azzapp/relay/artifacts/PostCreationScreenMutation.graphql';
import type { ReactElement } from 'react';
import type { PhotoIdentifier } from 'react-native-photo-gallery-api';
import type { Observable } from 'relay-runtime';

const MAX_VIDEO_DURATION = 30;

type STEPS = 'CONTENT' | 'EDITING' | 'PICKER';

const PostCreationScreen = () => {
  const [currentStep, setCurrentStep] = useState<STEPS>('PICKER');
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
  } = useImageEditorState(MAX_VIDEO_DURATION);

  const onNext = () => {
    if (currentStep === 'PICKER') {
      setCurrentStep('EDITING');
    } else {
      setCurrentStep('CONTENT');
    }
  };

  const router = useRouter();

  const onBack = () => {
    switch (currentStep) {
      case 'CONTENT':
        setCurrentStep('EDITING');
        break;
      case 'EDITING':
        setCurrentStep('PICKER');
        break;
      case 'PICKER':
        router.back();
        break;
    }
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

  const onPermissionRequestFailed = () => {
    router.back();
  };

  const [allowLikes, setAllowLikes] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [content, setContent] = useState('');

  const [commit] = useMutation<PostCreationScreenMutation>(graphql`
    mutation PostCreationScreenMutation($input: CreatePostInput!) {
      createPost(input: $input) {
        post {
          author {
            id
            userName
          }
        }
      }
    }
  `);

  const WebAPI = useWebAPI();
  const [uploadProgress, setUploadProgress] =
    useState<Observable<number> | null>(null);
  const [saving, setSaving] = useState(false);
  const onSave = async () => {
    if (!currentMediaInfos) {
      return;
    }
    setSaving(true);
    const ratio = currentMediaInfos.width / currentMediaInfos.height;
    const path = await exportMedia({
      uri: currentMediaInfos.uri,
      kind: currentMediaInfos.kind,
      editionParameters,
      aspectRatio: ratio,
      filter: mediaFilter,
      ...timeRange,
    });

    const { uploadURL, uploadParameters } = await WebAPI.uploadSign({
      kind: currentMediaInfos.kind,
      target: 'post',
    });
    const file: any = {
      name: getFileName(path),
      uri: `file://${path}`,
      type:
        currentMediaInfos.kind === 'picture' ? 'image/jpeg' : 'video/quicktime',
    };
    const { progress: uploadProgress, promise: uploadPromise } =
      WebAPI.uploadMedia(file, uploadURL, uploadParameters);
    setUploadProgress(uploadProgress);
    const { public_id } = await uploadPromise;
    commit({
      variables: {
        input: {
          media: {
            kind: currentMediaInfos.kind,
            source: public_id,
            ratio,
          },
          allowComments,
          allowLikes,
          content,
        },
      },
      onCompleted(response) {
        // TODO use fragment instead of response
        router.replace({
          route: 'USER_POSTS',
          params: {
            userName: response.createPost?.post?.author.userName as string,
          },
        });
      },
    });
  };

  const { top: safeAreaTop, bottom: safeAreaBottom } = useSafeAreaInsets();

  let rightButton: ReactElement | null = null;
  if (saving) {
    rightButton = <ActivityIndicator style={{ marginRight: 10 }} />;
  } else if (
    (currentStep === 'PICKER' && currentMediaInfos) ||
    (currentStep === 'EDITING' && !editedParameter)
  ) {
    rightButton = <TextHeaderButton text="Next" onPress={onNext} />;
  } else if (currentStep === 'EDITING' && editedParameter === 'cropData') {
    rightButton = <IconButton icon="rotate" onPress={updateOrientation} />;
  } else if (currentStep === 'CONTENT') {
    rightButton = <TextHeaderButton text="OK" onPress={onSave} />;
  }
  return (
    <>
      <View
        style={{
          backgroundColor: 'white',
          flex: 1,
          paddingTop: safeAreaTop,
        }}
      >
        <Header
          leftButton={<IconButton icon="chevron" onPress={onBack} />}
          rightButton={rightButton}
          title="New Publication"
        />
        <View
          style={{
            flex: 1,
            padding: 20,
            backgroundColor: colors.lightGrey,
          }}
        >
          {currentMediaInfos && (
            <ImageEditor
              style={{ flex: 1 }}
              aspectRatio={currentMediaInfos.width / currentMediaInfos.height}
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
          {currentStep === 'PICKER' && (
            <PhotoGalleryMediaList
              selectedMediaURI={currentMediaInfos?.assetUri}
              onSelectMedia={onSelectMedia}
              kind="mixed"
              contentContainerStyle={{ paddingBottom: safeAreaBottom }}
              onPermissionRequestFailed={onPermissionRequestFailed}
            />
          )}
          {currentStep === 'EDITING' && (
            <ImageEditorPanel
              key={currentMediaInfos!.uri}
              mediaInfo={currentMediaInfos!}
              aspectRatio={currentMediaInfos!.width / currentMediaInfos!.height}
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
          )}
          {currentStep === 'CONTENT' && (
            <PostContentPanel
              allowLikes={allowLikes}
              allowComments={allowComments}
              content={content}
              onAllowLikesChange={setAllowLikes}
              onAllowCommentsChange={setAllowComments}
              onContentChange={setContent}
              style={{
                flex: 1,
                marginBottom: safeAreaBottom,
                marginTop: 20,
              }}
            />
          )}
        </View>
      </View>
      <UploadProgressModal
        visible={!!uploadProgress}
        progressIndicator={uploadProgress}
      />
    </>
  );
};

export default PostCreationScreen;

// TODO create and helpers
const getFileName = (path: string) => {
  const arr = path.split('/');
  return arr[arr.length - 1];
};
