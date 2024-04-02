import { Suspense, useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Dimensions, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import {
  CancelHeaderButton,
  SaveHeaderButton,
} from '#components/commonsButtons';
import CoverEditor from '#components/CoverEditor';
import { useRouter } from '#components/NativeRouter';
import fetchQueryAndRetain from '#helpers/fetchQueryAndRetain';
import { prefetchImage, prefetchVideo } from '#helpers/mediaHelpers';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import type { CoverEditorHandle } from '#components/CoverEditor/CoverEditor';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CoverEditionScreenPrefetchQuery } from '#relayArtifacts/CoverEditionScreenPrefetchQuery.graphql';
import type { CoverEditionScreenQuery } from '#relayArtifacts/CoverEditionScreenQuery.graphql';
import type { CoverEditionRoute } from '#routes';
import type { Ref } from 'react';
import type { PreloadedQuery } from 'react-relay';

const { height: windowHeight } = Dimensions.get('screen');

const CoverEditionScreen = ({
  preloadedQuery,
}: RelayScreenProps<CoverEditionRoute, CoverEditionScreenQuery>) => {
  const intl = useIntl();
  const router = useRouter();

  const coverEditorRef = useRef<CoverEditorHandle>(null);
  const [canSave, setCanSave] = useState(true);

  const onSave = useCallback(() => {
    coverEditorRef.current?.save();
  }, []);

  const onCoverSaved = useCallback(() => {
    router.back();
  }, [router]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  const insets = useScreenInsets();

  const editorHeight =
    windowHeight - HEADER_HEIGHT - insets.top - insets.bottom;

  return (
    <Container
      style={{
        flex: 1,
        paddingTop: insets.top,
      }}
    >
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Edit your cover',
          description: 'CoverEditionScreen header title',
        })}
        leftElement={<CancelHeaderButton onPress={onCancel} />}
        rightElement={<SaveHeaderButton onPress={onSave} disabled={!canSave} />}
      />
      <Suspense
        fallback={
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator />
          </View>
        }
      >
        <CoverEditionScreenCoverEditor
          preloadedQuery={preloadedQuery}
          coverEditorRef={coverEditorRef}
          editorHeight={editorHeight}
          onCoverSaved={onCoverSaved}
          onCanSaveChange={setCanSave}
        />
      </Suspense>
    </Container>
  );
};

type CoverEditionScreenCoverEditorProps = {
  preloadedQuery: PreloadedQuery<CoverEditionScreenQuery>;
  coverEditorRef: Ref<CoverEditorHandle>;
  editorHeight: number;
  onCoverSaved: () => void;
  onCanSaveChange: (canSave: boolean) => void;
};

const CoverEditionScreenCoverEditor = ({
  preloadedQuery,
  coverEditorRef,
  editorHeight,
  onCoverSaved,
  onCanSaveChange,
}: CoverEditionScreenCoverEditorProps) => {
  const { node } = usePreloadedQuery<CoverEditionScreenQuery>(
    query,
    preloadedQuery,
  );

  if (!node?.profile) {
    return null;
  }

  return (
    <CoverEditor
      ref={coverEditorRef}
      profile={node.profile}
      height={editorHeight}
      onCoverSaved={onCoverSaved}
      onCanSaveChange={onCanSaveChange}
    />
  );
};

const query = graphql`
  query CoverEditionScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ...CoverEditor_profile @alias(as: "profile")
    }
  }
`;

export default relayScreen(CoverEditionScreen, {
  query,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
  prefetch: (_, environment, profileInfos) => {
    const profileId = profileInfos?.profileId;
    if (!profileId) {
      return null;
    }
    return fetchQueryAndRetain<CoverEditionScreenPrefetchQuery>(
      environment,
      graphql`
        query CoverEditionScreenPrefetchQuery($profileId: ID!) {
          profile: node(id: $profileId) {
            ...CoverEditor_profile @relay(mask: false)
          }
        }
      `,
      { profileId },
    ).mergeMap(({ profile }) => {
      if (!profile?.webCard?.cardCover) {
        return [];
      }
      const { background, foreground, sourceMedia, maskMedia } =
        profile.webCard.cardCover;
      const medias = convertToNonNullArray([
        background && { kind: 'image', uri: background.uri },
        foreground && foreground.kind !== 'lottie'
          ? {
              kind: 'image',
              uri: foreground.uri,
            }
          : null,
        sourceMedia && {
          kind: sourceMedia.__typename === 'MediaVideo' ? 'video' : 'image',
          uri: sourceMedia.uri,
        },
        maskMedia && { kind: 'image', uri: maskMedia.uri },
      ]);
      return combineLatest(
        medias.map(media => {
          const prefetch =
            media.kind === 'image' ? prefetchImage : prefetchVideo;
          return prefetch(media.uri);
        }),
      );
    });
  },
});
