import { Suspense, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Appearance, StyleSheet } from 'react-native';
import { fetchQuery, graphql, usePreloadedQuery } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { useRouter } from '#PlatformEnvironment';
import { prefetchImage, prefetchVideo } from '#components/medias';
import { useNativeNavigationEvent } from '#components/NativeRouter';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import CoverEditionScreen, {
  CoverEditionScreenFallback,
} from '#screens/CoverEditionScreen';
import Container from '#ui/Container';
import type { CoverEditionMobileScreenPrefetchQuery } from '@azzapp/relay/artifacts/CoverEditionMobileScreenPrefetchQuery.graphql';
import type { CoverEditionMobileScreenQuery } from '@azzapp/relay/artifacts/CoverEditionMobileScreenQuery.graphql';
import type { CoverEditionScreen_viewer$key } from '@azzapp/relay/artifacts/CoverEditionScreen_viewer.graphql';
import type { PreloadedQuery } from 'react-relay';

type CoverEditionMobileScreenProps = {
  /**
   * Whether the screen is used for a new cover creation
   */
  isCreation?: boolean;
  /**
   * The preloaded query for the screen
   */
  preloadedQuery: PreloadedQuery<CoverEditionMobileScreenQuery>;
};

/**
 * Mobile specific screen for the cover edition
 * (In case of future web support)
 * Will display a fallback while the query is loading or the screen is animating
 */
const CoverEditionMobileScreen = ({
  isCreation,
  preloadedQuery,
}: CoverEditionMobileScreenProps) => {
  const [animating, setAnimating] = useState(true);
  useNativeNavigationEvent('appear', () => {
    setAnimating(false);
  });

  const [screenReady, setScreenReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const onScreenReady = useCallback(() => {
    setScreenReady(true);
  }, []);

  const intl = useIntl();
  const router = useRouter();
  const onError = useCallback(() => {
    if (!screenReady) {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: 'Loading error',
          description: 'CoverEditionScreen alert message loading error title',
        }),
        intl.formatMessage({
          defaultMessage: 'Could not load the cover edition screen',
          description: 'CoverEditionScreen alert message loading error text',
        }),
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'Cancel',
              description:
                'CoverEditionScreen alert message loading error cancel button',
            }),
            onPress: () => {
              router.back();
            },
            style: 'cancel',
          },
          {
            text: intl.formatMessage({
              defaultMessage: 'Retry',
              description:
                'CoverEditionScreen alert message loading error retry button',
            }),
            onPress: () => setRetryCount(count => count + 1),
          },
        ],
        {
          userInterfaceStyle: Appearance.getColorScheme() ?? 'light',
        },
      );
    }
  }, [screenReady, intl, router]);

  const data = usePreloadedQuery(
    graphql`
      query CoverEditionMobileScreenQuery {
        viewer {
          ...CoverEditionScreen_viewer
        }
      }
    `,
    preloadedQuery,
  );

  return (
    <Container style={{ flex: 1 }}>
      {!animating && (
        <Suspense>
          <CoverEditionScreen
            key={`cover-edition-screen-${retryCount}`}
            viewer={data.viewer as CoverEditionScreen_viewer$key}
            onReady={onScreenReady}
            onError={onError}
            style={StyleSheet.absoluteFill}
          />
        </Suspense>
      )}
      {(!screenReady || animating) && (
        <CoverEditionScreenFallback
          isCreation={isCreation}
          style={StyleSheet.absoluteFill}
        />
      )}
    </Container>
  );
};

CoverEditionMobileScreen.prefetch = () => {
  const environment = getRelayEnvironment();
  return fetchQuery<CoverEditionMobileScreenPrefetchQuery>(
    environment,
    graphql`
      query CoverEditionMobileScreenPrefetchQuery {
        viewer {
          ...CoverEditionScreen_viewer @relay(mask: false)
          profile {
            card {
              cover {
                ...CoverEditionScreen_cover @relay(mask: false)
              }
            }
          }
        }
      }
    `,
    {},
  ).mergeMap(({ viewer }) => {
    const cover = viewer?.profile?.card?.cover;
    if (!cover) {
      return [];
    }
    const { background, foreground, sourceMedia } = cover;
    const medias = convertToNonNullArray([
      background && { kind: 'image', uri: background.uri },
      foreground && { kind: 'image', uri: foreground.uri },
      sourceMedia && {
        kind: sourceMedia.__typename === 'MediaVideo' ? 'video' : 'image',
        uri: sourceMedia.uri,
      },
    ]);
    return combineLatest(
      medias.map(media => {
        const prefetch = media.kind === 'image' ? prefetchImage : prefetchVideo;
        return prefetch(media.uri);
      }),
    );
  });
};

export default CoverEditionMobileScreen;
