import { Suspense, useCallback, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useLazyLoadQuery, usePreloadedQuery } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import {
  CancelHeaderButton,
  SaveHeaderButton,
} from '#components/commonsButtons';
import CoverEditor from '#components/CoverEditor';
import { prefetchImage, prefetchVideo } from '#components/medias';
import { useRouter } from '#components/NativeRouter';
import fetchQueryAndRetain from '#helpers/fetchQueryAndRetain';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import type { CoverEditorHandle } from '#components/CoverEditor/CoverEditor';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CoverEditionRoute } from '#routes';
import type { CoverEditionScreenCoverEditorQuery } from '@azzapp/relay/artifacts/CoverEditionScreenCoverEditorQuery.graphql';
import type { CoverEditionScreenPrefetchQuery } from '@azzapp/relay/artifacts/CoverEditionScreenPrefetchQuery.graphql';
import type { CoverEditionScreenQuery } from '@azzapp/relay/artifacts/CoverEditionScreenQuery.graphql';

const CoverEditionScreen = ({
  preloadedQuery,
}: RelayScreenProps<CoverEditionRoute, CoverEditionScreenQuery>) => {
  const { viewer } = usePreloadedQuery<CoverEditionScreenQuery>(
    query,
    preloadedQuery,
  );

  const templateKind = useMemo(
    () =>
      viewer.profile?.cardCover?.media?.__typename === 'MediaVideo'
        ? 'video'
        : viewer.profile?.cardCover?.segmented === false
        ? 'others'
        : 'people',
    // we only want to recompute the template kind the first time
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <Suspense>
      <CoverEditionScreenInner templateKind={templateKind} />
    </Suspense>
  );
};

type CoverEditionScreenInnerProps = {
  templateKind: 'others' | 'people' | 'video';
};

const CoverEditionScreenInner = ({
  templateKind,
}: CoverEditionScreenInnerProps) => {
  const intl = useIntl();
  const router = useRouter();

  const coverEditorRef = useRef<CoverEditorHandle>(null);

  const onSave = useCallback(() => {
    coverEditorRef.current?.save();
  }, []);

  const onCoverSaved = useCallback(() => {
    router.back();
  }, [router]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  const { viewer } = useLazyLoadQuery<CoverEditionScreenCoverEditorQuery>(
    graphql`
      query CoverEditionScreenCoverEditorQuery(
        $templateKind: CoverTemplateKind!
      ) {
        viewer {
          ...CoverEditor_viewer @arguments(initialTemplateKind: $templateKind)
        }
      }
    `,
    { templateKind },
  );

  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const editorHeight =
    windowHeight -
    HEADER_HEIGHT -
    Math.max(insets.top, 16) -
    Math.max(insets.bottom, 16) -
    20;

  return (
    <Container
      style={{
        flex: 1,
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom, 16) + 20,
      }}
    >
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Edit your cover',
          description: 'CoverEditionScreen header title',
        })}
        leftElement={<CancelHeaderButton onPress={onCancel} />}
        rightElement={<SaveHeaderButton onPress={onSave} />}
      />
      <CoverEditor
        ref={coverEditorRef}
        viewer={viewer}
        height={editorHeight}
        onCoverSaved={onCoverSaved}
        initialTemplateKind={templateKind}
      />
    </Container>
  );
};

const query = graphql`
  query CoverEditionScreenQuery {
    viewer {
      profile {
        cardCover {
          media {
            __typename
          }
          segmented
        }
      }
    }
  }
`;

export default relayScreen(CoverEditionScreen, {
  query,
  prefetch: () => {
    const environment = getRelayEnvironment();
    return fetchQueryAndRetain<CoverEditionScreenPrefetchQuery>(
      environment,
      graphql`
        query CoverEditionScreenPrefetchQuery {
          viewer {
            ...CoverEditorCustom_viewer
            profile {
              ...useCoverEditionManager_profile @relay(mask: false)
            }
          }
          viewerPeople: viewer {
            ...CoverEditorTemplateList_viewer
              @arguments(initialTemplateKind: people)
          }
          viewerOthers: viewer {
            ...CoverEditorTemplateList_viewer
              @arguments(initialTemplateKind: others)
          }
          viewerVideo: viewer {
            ...CoverEditorTemplateList_viewer
              @arguments(initialTemplateKind: video)
          }
        }
      `,
      {},
    ).mergeMap(({ viewer }) => {
      if (!viewer.profile?.cardCover) {
        return [];
      }
      const { background, foreground, sourceMedia, maskMedia } =
        viewer.profile.cardCover;
      const medias = convertToNonNullArray([
        background && { kind: 'image', uri: background.uri },
        foreground && { kind: 'image', uri: foreground.uri },
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
