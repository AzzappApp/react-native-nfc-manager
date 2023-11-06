import { useMemo, useState } from 'react';
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
import ScreenModal from '#components/ScreenModal';
import { getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import relayScreen from '#helpers/relayScreen';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header from '#ui/Header';
import UploadProgressModal from '#ui/UploadProgressModal';
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
        webCard {
          id
          ...AuthorCartoucheFragment_webCard
        }
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
    profile?.webCard.id &&
    ConnectionHandler.getConnectionID(
      profile.webCard.id,
      'WebCardPostsList_webCard_connection_posts',
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

  const onFinished = async ({
    kind,
    uri,
    aspectRatio,
    editionParameters,
    filter,
    timeRange,
  }: ImagePickerResult) => {
    try {
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
      setProgressIndicator(uploadProgress);
      const { public_id } = await uploadPromise;
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
              `${kind.slice(0, 1)}:${public_id}`,
              kind === 'video' ? 'video' : 'image',
              `file://${exportedMedia.path}`,
            );
            // TODO use fragment instead of response
            // if (params?.fromProfile) {
            router.back();
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
          setProgressIndicator(null);
        },
        updater: store => {
          if (profile?.webCard.id) {
            const currentWebCard = store.get(profile.webCard.id);

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
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Error while creating post',
          description: 'Toast Error message while creating post',
        }),
      });
      setProgressIndicator(null);
    }
  };

  const contextValue = useMemo(
    () => ({
      allowLikes,
      allowComments,
      content,
      setAllowLikes,
      setAllowComments,
      setContent,
      webCard: profile?.webCard ?? null,
    }),
    [allowComments, allowLikes, content, profile?.webCard],
  );

  if (!profile) {
    // TODO redirect to login ?
    return null;
  }

  return (
    <>
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

      <ScreenModal visible={!!progressIndicator}>
        {progressIndicator && (
          <UploadProgressModal progressIndicator={progressIndicator} />
        )}
      </ScreenModal>
    </>
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
