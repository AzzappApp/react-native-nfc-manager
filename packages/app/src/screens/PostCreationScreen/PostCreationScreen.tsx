import { ImageFormat } from '@shopify/react-native-skia';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
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
import { waitTime } from '@azzapp/shared/asyncHelpers';
import {
  POST_IMAGE_MAX_SIZE,
  POST_VIDEO_BIT_RATE,
  POST_VIDEO_FRAME_RATE,
  POST_VIDEO_MAX_SIZE,
} from '@azzapp/shared/postHelpers';
import { colors } from '#theme';
import { CancelHeaderButton } from '#components/commonsButtons';
import ImagePicker, {
  SelectImageStep,
  EditImageStep,
} from '#components/ImagePicker';
import {
  useRouter,
  ScreenModal,
  preventModalDismiss,
} from '#components/NativeRouter';
import { getFileName } from '#helpers/fileHelpers';
import {
  saveTransformedImageToFile,
  saveTransformedVideoToFile,
} from '#helpers/mediaEditions';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import relayScreen from '#helpers/relayScreen';
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import { get as PixelRatio } from '#relayProviders/PixelRatio.relayprovider';
import { get as PostWidth } from '#relayProviders/PostWidth.relayprovider';
import { get as ScreenWidth } from '#relayProviders/ScreenWidth.relayprovider';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header from '#ui/Header';
import UploadProgressModal from '#ui/UploadProgressModal';
import PostContentStep from './PostContentStep';
import PostCreationScreenContext from './PostCreationScreenContext';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { PostCreationScreenMutation } from '#relayArtifacts/PostCreationScreenMutation.graphql';
import type { PostCreationScreenQuery } from '#relayArtifacts/PostCreationScreenQuery.graphql';
import type { NewPostRoute } from '#routes';

const POST_MAX_DURATION = 15;

const postCreationScreenQuery = graphql`
  query PostCreationScreenQuery($webCardId: ID!) {
    webCard: node(id: $webCardId) {
      id
      ... on WebCard {
        userName
        cardIsPublished
      }
      ...AuthorCartoucheFragment_webCard
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
  const { webCard } = usePreloadedQuery(
    postCreationScreenQuery,
    preloadedQuery,
  );

  const handleProfileActionError = useHandleProfileActionError(
    intl.formatMessage({
      defaultMessage: 'Error while creating post',
      description: 'Toast Error message while creating post',
    }),
  );

  const connectionID =
    webCard &&
    ConnectionHandler.getConnectionID(
      webCard.id,
      'WebCardPostsList_webCard_connection_posts',
    );

  const router = useRouter();

  useEffect(() => {
    if (!webCard?.cardIsPublished) {
      router.replace({ route: 'HOME' });
    }
  }, [webCard?.cardIsPublished, router]);

  const [commit] = useMutation<PostCreationScreenMutation>(graphql`
    mutation PostCreationScreenMutation(
      $connections: [ID!]!
      $webCardId: ID!
      $input: CreatePostInput!
      $screenWidth: Float!
      $postWith: Float!
      $cappedPixelRatio: Float!
      $pixelRatio: Float!
    ) {
      createPost(webCardId: $webCardId, input: $input) {
        post @prependNode(connections: $connections, edgeTypeName: "PostEdge") {
          id
          content
          allowLikes
          allowComments
          counterComments
          counterReactions
          webCard {
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

  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);

  const onFinished = useCallback(
    async ({
      kind,
      uri,
      aspectRatio,
      rotation,
      width,
      height,
      editionParameters,
      filter,
      timeRange,
    }: ImagePickerResult) => {
      if (!webCard) {
        return;
      }
      try {
        setProgressIndicator(Observable.from(0));
        if (kind === 'video') {
          // we need to wait for the video player to be released before we can start the video export
          // to avoid memory issues
          await waitTime(50);
        }
        const maxSize =
          kind === 'image' ? POST_IMAGE_MAX_SIZE : POST_VIDEO_MAX_SIZE;
        const resolution = {
          width: aspectRatio >= 1 ? maxSize : maxSize * aspectRatio,
          height: aspectRatio < 1 ? maxSize : maxSize / aspectRatio,
        };
        const path = await (kind === 'image'
          ? saveTransformedImageToFile({
              uri,
              resolution,
              format: ImageFormat.JPEG,
              quality: 95,
              filter,
              editionParameters,
            })
          : saveTransformedVideoToFile({
              video: {
                uri,
                width,
                height,
                rotation,
              },
              resolution,
              bitRate: POST_VIDEO_BIT_RATE,
              frameRate: POST_VIDEO_FRAME_RATE,
              duration: timeRange?.duration,
              startTime: timeRange?.startTime,
              filter,
              editionParameters,
            }));

        const fileName = getFileName(path);
        const file: any = {
          name: fileName,
          uri: `file://${path}`,
          type:
            mime.lookup(fileName) ||
            (kind === 'image' ? 'image/jpeg' : 'video/mp4'),
        };

        const { uploadURL, uploadParameters } = await uploadSign({
          kind: kind === 'video' ? 'video' : 'image',
          target: 'post',
        });
        const { progress: uploadProgress, promise: uploadPromise } =
          uploadMedia(file, uploadURL, uploadParameters);
        setProgressIndicator(
          uploadProgress.map(({ loaded, total }) => loaded / total),
        );
        const { public_id } = await uploadPromise;
        commit({
          variables: {
            webCardId: webCard.id,
            input: {
              mediaId: public_id,
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
                `file://${path}`,
              );

              if (response.createPost.post?.id && webCard.userName) {
                router.replace({
                  route: 'WEBCARD',
                  params: {
                    userName: webCard.userName,
                    showPosts: true,
                  },
                });
              } else {
                router.back();
              }
            }
          },
          onError(error) {
            handleProfileActionError(error);
            setProgressIndicator(null);
          },
          updater: store => {
            if (webCard.id) {
              const currentWebCard = store.get(webCard.id);

              if (currentWebCard) {
                const nbPosts = currentWebCard?.getValue('nbPosts');

                if (typeof nbPosts === 'number') {
                  currentWebCard.setValue(nbPosts + 1, 'nbPosts');
                }
              }
            }
          },
        });
      } catch (e) {
        console.warn(e);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Error while creating post',
            description: 'Toast Error message while creating post',
          }),
        });
        setProgressIndicator(null);
      }
    },
    [
      allowComments,
      allowLikes,
      commit,
      connectionID,
      content,
      handleProfileActionError,
      intl,
      router,
      webCard,
    ],
  );

  const contextValue = useMemo(
    () => ({
      allowLikes,
      allowComments,
      content,
      setAllowLikes,
      setAllowComments,
      setContent,
      webCard: webCard ?? null,
    }),
    [allowComments, allowLikes, content, webCard],
  );

  if (!webCard) {
    // TODO redirect to login ?
    return null;
  }

  return (
    <>
      <PostCreationScreenContext.Provider value={contextValue}>
        <ImagePicker
          maxVideoDuration={POST_MAX_DURATION}
          forceCameraRatio={1}
          onCancel={router.back}
          onFinished={onFinished}
          busy={!!progressIndicator}
          steps={steps}
          exporting={!!progressIndicator}
        />
      </PostCreationScreenContext.Provider>

      <ScreenModal
        visible={!!progressIndicator}
        onRequestDismiss={preventModalDismiss}
        gestureEnabled={false}
      >
        {progressIndicator && (
          <UploadProgressModal progressIndicator={progressIndicator} />
        )}
      </ScreenModal>
    </>
  );
};

const steps = [SelectImageStep, EditImageStep, PostContentStep];

PostCreationScreen.options = {
  stackAnimation: 'slide_from_bottom',
};

const PostCreationScreenFallback = () => {
  const router = useRouter();
  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header leftElement={<CancelHeaderButton onPress={router.back} />} />
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
  query: postCreationScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
  }),
  fallback: PostCreationScreenFallback,
});
