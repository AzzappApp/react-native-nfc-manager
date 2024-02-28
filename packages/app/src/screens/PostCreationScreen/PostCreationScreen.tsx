import { useCallback, useMemo, useState } from 'react';
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
import { waitTime } from '@azzapp/shared/asyncHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { colors } from '#theme';
import { CancelHeaderButton } from '#components/commonsButtons';
import { getFilterUri } from '#components/gpu';
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
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import { get as PixelRatio } from '#relayProviders/PixelRatio.relayprovider';
import { get as PostWidth } from '#relayProviders/PostWidth.relayprovider';
import { get as ScreenWidth } from '#relayProviders/ScreenWidth.relayprovider';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header from '#ui/Header';
import UploadProgressModal from '#ui/UploadProgressModal';
import exportMedia from './exportMedia';
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
      editionParameters,
      filter,
      timeRange,
    }: ImagePickerResult) => {
      if (!webCard) {
        return;
      }
      try {
        setProgressIndicator(Observable.from(0));
        if (Platform.OS === 'android' && kind === 'video') {
          // on Android we need to be sure that the player is released to avoid memory overload
          await waitTime(50);
        }
        const exportedMedia = await exportMedia({
          uri,
          kind,
          editionParameters,
          aspectRatio,
          filterUri: getFilterUri(filter),
          ...timeRange,
        });

        const fileName = getFileName(exportedMedia.path);
        const file: any = {
          name: fileName,
          uri: exportedMedia.path.startsWith('file://')
            ? exportMedia
            : `file://${exportedMedia.path}`,
          type:
            mime.lookup(fileName) ||
            (kind === 'image' ? 'image/jpeg' : 'video/quicktime'),
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

      <ScreenModal visible={!!progressIndicator}>
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
