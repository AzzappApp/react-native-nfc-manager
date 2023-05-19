import { useMemo, useState } from 'react';
import * as mime from 'react-native-mime-types';
import { graphql, useFragment, useMutation } from 'react-relay';
import { useRouter, useWebAPI } from '#PlatformEnvironment';
import ImagePicker, {
  SelectImageStep,
  EditImageStep,
} from '#components/ImagePicker';
import { addLocalCachedMediaFile } from '#components/medias';
import { getFileName } from '#helpers/fileHelpers';
import UploadProgressModal from '#ui/UploadProgressModal';
import exportMedia from './exportMedia';
import PostContentStep from './PostContentStep';
import PostCreationScreenContext from './PostCreationScreenContext';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { PostCreationScreen_viewer$key } from '@azzapp/relay/artifacts/PostCreationScreen_viewer.graphql';
import type { PostCreationScreenMutation } from '@azzapp/relay/artifacts/PostCreationScreenMutation.graphql';
import type { Observable } from 'relay-runtime';

const POST_MAX_DURATION = 15;

type PostCreationScreenProps = {
  viewer: PostCreationScreen_viewer$key;
};

const PostCreationScreen = ({ viewer: viewerKey }: PostCreationScreenProps) => {
  const [allowLikes, setAllowLikes] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [content, setContent] = useState('');

  const { profile } = useFragment(
    graphql`
      fragment PostCreationScreen_viewer on Viewer {
        profile {
          ...AuthorCartoucheFragment_profile
        }
      }
    `,
    viewerKey,
  );

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
    editionParameters,
    filter,
    timeRange,
  }: ImagePickerResult) => {
    setSaving(true);

    const exportedMedia = await exportMedia({
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
    const fileName = getFileName(exportedMedia.uri);
    const file: any = {
      name: fileName,
      uri: `file://${exportedMedia.uri}`,
      type:
        mime.lookup(fileName) ||
        (kind === 'image' ? 'image/jpeg' : 'video/quicktime'),
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
            width: exportedMedia.size.width,
            height: exportedMedia.size.height,
          },
          allowComments,
          allowLikes,
          content,
        },
      },
      onCompleted(response) {
        addLocalCachedMediaFile(
          public_id,
          kind === 'video' ? 'video' : 'image',
          `file://${exportedMedia.uri}`,
        );
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
      profile,
    }),
    [allowComments, allowLikes, content, profile],
  );

  if (!profile) {
    // TODO redirect to login ?
    return null;
  }

  return (
    <PostCreationScreenContext.Provider value={contextValue}>
      <ImagePicker
        maxVideoDuration={POST_MAX_DURATION}
        forceCameraRatio={1}
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
