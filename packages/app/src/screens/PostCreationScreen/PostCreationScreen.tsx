import { useMemo, useState } from 'react';
import * as mime from 'react-native-mime-types';
import {
  ConnectionHandler,
  graphql,
  useMutation,
  usePreloadedQuery,
} from 'react-relay';
import ImagePicker, {
  SelectImageStep,
  EditImageStep,
} from '#components/ImagePicker';
import { addLocalCachedMediaFile } from '#components/medias';
import { useRouter } from '#components/NativeRouter';
import { getFileName } from '#helpers/fileHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import relayScreen from '#helpers/relayScreen';
import UploadProgressModal from '#ui/UploadProgressModal';
import exportMedia from './exportMedia';
import PostContentStep from './PostContentStep';
import PostCreationScreenContext from './PostCreationScreenContext';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { NewPostRoute } from '#routes';
import type { PostCreationScreenMutation } from '@azzapp/relay/artifacts/PostCreationScreenMutation.graphql';
import type { PostCreationScreenQuery } from '@azzapp/relay/artifacts/PostCreationScreenQuery.graphql';
import type { Observable } from 'relay-runtime';

const POST_MAX_DURATION = 15;

const postCreationcreenQuery = graphql`
  query PostCreationScreenQuery {
    viewer {
      profile {
        id
        ...AuthorCartoucheFragment_profile
      }
    }
  }
`;

const PostCreationScreen = ({
  preloadedQuery,
}: RelayScreenProps<NewPostRoute, PostCreationScreenQuery>) => {
  const [allowLikes, setAllowLikes] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [content, setContent] = useState('');
  const {
    viewer: { profile },
  } = usePreloadedQuery(postCreationcreenQuery, preloadedQuery);

  const connectionID =
    profile?.id &&
    ConnectionHandler.getConnectionID(
      profile.id,
      'ProfilePostsListprofile_connection_posts',
    );

  const router = useRouter();
  const onCancel = () => {
    router.back();
  };

  const [commit] = useMutation<PostCreationScreenMutation>(graphql`
    mutation PostCreationScreenMutation(
      $connections: [ID!]!
      $input: CreatePostInput!
    ) {
      createPost(input: $input) {
        post @prependNode(connections: $connections, edgeTypeName: "PostEdge") {
          id
          content
          allowLikes
          allowComments
          author {
            id
            userName
          }
          media {
            id
            width
            height
          }
          createdAt
        }
      }
    }
  `);

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

    const { uploadURL, uploadParameters } = await uploadSign({
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
    const { progress: uploadProgress, promise: uploadPromise } = uploadMedia(
      file,
      uploadURL,
      uploadParameters,
    );
    setUploadProgress(uploadProgress);
    const { public_id } = await uploadPromise;
    setUploadProgress(null); //force to null to avoid a blink effect on uploadProgressModal
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
        connections: [connectionID!],
      },
      onCompleted(response) {
        addLocalCachedMediaFile(
          public_id,
          kind === 'video' ? 'video' : 'image',
          `file://${exportedMedia.uri}`,
        );
        // TODO use fragment instead of response
        router.replace({
          route: 'PROFILE',
          params: {
            userName: response.createPost?.post?.author.userName as string,
            showPosts: true,
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

PostCreationScreen.options = {
  stackAnimation: 'slide_from_bottom',
};

export default relayScreen(PostCreationScreen, {
  query: postCreationcreenQuery,
});
