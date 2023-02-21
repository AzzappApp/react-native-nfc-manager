import { useMemo, useState } from 'react';
import { graphql, useMutation } from 'react-relay';
import ImagePicker, {
  SelectImageStep,
  EditImageStep,
} from '../../components/ImagePicker';
import { getFileName } from '../../helpers/fileHelpers';
import { useRouter, useWebAPI } from '../../PlatformEnvironment';
import UploadProgressModal from '../../ui/UploadProgressModal';
import exportMedia from './exportMedia';
import PostContentStep from './PostContentStep';
import PostCreationScreenContext from './PostCreationScreenContext';
import type { ImagePickerResult } from '../../components/ImagePicker';
import type { PostCreationScreenMutation } from '@azzapp/relay/artifacts/PostCreationScreenMutation.graphql';
import type { Observable } from 'relay-runtime';

const POST_MAX_DURATION = 30;

const PostCreationScreen = () => {
  const [allowLikes, setAllowLikes] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [content, setContent] = useState('');

  const router = useRouter();
  const onCancel = () => {
    router.back();
  };

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
  const onFinished = async ({
    kind,
    uri,
    aspectRatio,
    width,
    height,
    editionParameters,
    filter,
    timeRange,
  }: ImagePickerResult) => {
    setSaving(true);
    const path = await exportMedia({
      uri,
      kind,
      editionParameters,
      aspectRatio,
      filter,
      ...timeRange,
    });

    const { uploadURL, uploadParameters } = await WebAPI.uploadSign({
      kind: kind === 'video' ? 'video' : 'image',
      target: 'post',
    });
    const file: any = {
      name: getFileName(path),
      uri: `file://${path}`,
      type: kind === 'image' ? 'image/jpeg' : 'video/quicktime',
    };
    const { progress: uploadProgress, promise: uploadPromise } =
      WebAPI.uploadMedia(file, uploadURL, uploadParameters);
    setUploadProgress(uploadProgress);
    const { public_id } = await uploadPromise;
    commit({
      variables: {
        input: {
          media: {
            kind: kind === 'video' ? 'video' : 'image',
            id: public_id,
            width,
            height,
          },
          allowComments,
          allowLikes,
          content,
        },
      },
      onCompleted(response) {
        // TODO use fragment instead of response
        router.replace({
          route: 'PROFILE_POSTS',
          params: {
            userName: response.createPost?.post?.author.userName as string,
          },
        });
      },
    });
  };

  const contextValue = useMemo(
    () => ({
      allowLikes,
      allowComments,
      content,
      setAllowLikes,
      setAllowComments,
      setContent,
    }),
    [allowComments, allowLikes, content],
  );

  return (
    <PostCreationScreenContext.Provider value={contextValue}>
      <ImagePicker
        maxVideoDuration={POST_MAX_DURATION}
        onCancel={onCancel}
        onFinished={onFinished}
        busy={saving}
        steps={[SelectImageStep, EditImageStep, PostContentStep]}
        exporting={saving}
      />
      <UploadProgressModal
        visible={!!uploadProgress}
        progressIndicator={uploadProgress}
      />
    </PostCreationScreenContext.Provider>
  );
};

export default PostCreationScreen;
