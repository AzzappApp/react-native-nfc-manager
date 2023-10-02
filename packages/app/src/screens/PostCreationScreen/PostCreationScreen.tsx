import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Platform, View } from 'react-native';
import * as mime from 'react-native-mime-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  ConnectionHandler,
  graphql,
  useMutation,
  usePreloadedQuery,
} from 'react-relay';
import { Observable } from 'relay-runtime';
import { get as CappedPixelRatio } from '@azzapp/relay/providers/CappedPixelRatio.relayprovider';
import { get as PixelRatio } from '@azzapp/relay/providers/PixelRatio.relayprovider';
import { get as PostWidth } from '@azzapp/relay/providers/PostWidth.relayprovider';
import { get as ScreenWidth } from '@azzapp/relay/providers/ScreenWidth.relayprovider';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { colors } from '#theme';
import { CancelHeaderButton } from '#components/commonsButtons';
import ImagePicker, {
  SelectImageStep,
  EditImageStep,
} from '#components/ImagePicker';
import { useRouter } from '#components/NativeRouter';
import { getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import relayScreen from '#helpers/relayScreen';
import { useProgressModal } from '#hooks/useProgressModal';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header from '#ui/Header';
import exportMedia from './exportMedia';
import PostContentStep from './PostContentStep';
import PostCreationScreenContext from './PostCreationScreenContext';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { NewPostRoute } from '#routes';
import type { PostCreationScreenMutation } from '@azzapp/relay/artifacts/PostCreationScreenMutation.graphql';
import type { PostCreationScreenQuery } from '@azzapp/relay/artifacts/PostCreationScreenQuery.graphql';

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
  preloadedQuery, // route: { params },
}: RelayScreenProps<NewPostRoute, PostCreationScreenQuery>) => {
  const [allowLikes, setAllowLikes] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [content, setContent] = useState('');
  const intl = useIntl();
  const {
    viewer: { profile },
  } = usePreloadedQuery(postCreationcreenQuery, preloadedQuery);

  const connectionID =
    profile?.id &&
    ConnectionHandler.getConnectionID(
      profile.id,
      'ProfilePostsList_profile_connection_posts',
    );

  const router = useRouter();
  const onCancel = () => {
    router.back();
  };

  const [commit] = useMutation<PostCreationScreenMutation>(graphql`
    mutation PostCreationScreenMutation(
      $connections: [ID!]!
      $input: CreatePostInput!
      $screenWidth: Float!
      $postWith: Float!
      $cappedPixelRatio: Float!
      $pixelRatio: Float!
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
            aspectRatio
            largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
            smallURI: uri(width: $postWith, pixelRatio: $cappedPixelRatio)
            ... on MediaVideo {
              largeThumbnail: thumbnail(
                width: $screenWidth
                pixelRatio: $pixelRatio
              )
              smallThumbnail: thumbnail(
                width: $postWith
                pixelRatio: $cappedPixelRatio
              )
            }
          }
          createdAt
        }
      }
    }
  `);

  const { progressIndicator, setProgressIndicator } = useProgressModal();

  const onFinished = async ({
    kind,
    uri,
    aspectRatio,
    editionParameters,
    filter,
    timeRange,
  }: ImagePickerResult) => {
    setProgressIndicator(Observable.from(0));
    const exportedMedia = await exportMedia({
      uri,
      kind,
      editionParameters,
      aspectRatio,
      filter,
      ...timeRange,
    });

    const fileName = getFileName(exportedMedia.path);
    const file: any = {
      name: fileName,
      uri: `file://${exportedMedia.path}`,
      type:
        mime.lookup(fileName) ||
        (kind === 'image' ? 'image/jpeg' : 'video/quicktime'),
    };

    const { uploadURL, uploadParameters } = await uploadSign({
      kind: kind === 'video' ? 'video' : 'image',
      target: 'post',
    });
    const { progress: uploadProgress, promise: uploadPromise } = uploadMedia(
      file,
      uploadURL,
      uploadParameters,
    );
    // TODO uploadProgressModal crash on android
    if (Platform.OS === 'ios') {
      setProgressIndicator(uploadProgress);
    }
    const { public_id } = await uploadPromise;
    setProgressIndicator(null); //force to null to avoid a blink effect on uploadProgressModal
    commit({
      variables: {
        input: {
          mediaId: encodeMediaId(public_id, kind),
          allowComments,
          allowLikes,
          content,
        },
        screenWidth: ScreenWidth(),
        postWith: PostWidth(),
        cappedPixelRatio: CappedPixelRatio(),
        pixelRatio: PixelRatio(),
        connections: [connectionID!],
      },
      onCompleted(response, error) {
        if (error) {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error while creating post',
              description: 'Toast Error message while creating post',
            }),
          });
        } else {
          Toast.show({
            type: 'success',
            text1: intl.formatMessage({
              defaultMessage: 'Post created',
              description: 'Toast Success message while creating post',
            }),
          });
          addLocalCachedMediaFile(
            public_id,
            kind === 'video' ? 'video' : 'image',
            `file://${exportedMedia.path}`,
          );
          // TODO use fragment instead of response
          // if (params?.fromProfile) {
          router.pop(2);
          // } else {
          //   router.replace({
          //     route: 'PROFILE',
          //     params: {
          //       userName: response.createPost?.post?.author.userName as string,
          //       showPosts: true,
          //     },
          //   });
          // }
        }
      },
      onError() {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Error while creating post',
            description: 'Toast Error message while creating post',
          }),
        });
      },
      updater: store => {
        if (profile?.id) {
          const currentProfile = store.get(profile.id);

          if (currentProfile) {
            const nbPosts = currentProfile?.getValue('nbPosts');

            if (typeof nbPosts === 'number') {
              currentProfile.setValue(nbPosts + 1, 'nbPosts');
            }
          }
        }
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
        busy={!!progressIndicator}
        steps={[SelectImageStep, EditImageStep, PostContentStep]}
        exporting={!!progressIndicator}
      />
    </PostCreationScreenContext.Provider>
  );
};

PostCreationScreen.options = {
  stackAnimation: 'slide_from_bottom',
};

const PostCreationScreenFallback = () => {
  const router = useRouter();
  const onBack = () => {
    router.back();
  };
  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header leftElement={<CancelHeaderButton onPress={onBack} />} />
        <View style={{ aspectRatio: 1, backgroundColor: colors.grey100 }} />
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    </Container>
  );
};

export default relayScreen(PostCreationScreen, {
  query: postCreationcreenQuery,
  fallback: PostCreationScreenFallback,
});
