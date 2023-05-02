import { Suspense, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Appearance, StyleSheet } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import { useNativeNavigationEvent } from '#components/NativeRouter';
import CoverEditionScreen, {
  CoverEditionScreenFallback,
} from '#screens/CoverEditionScreen';
import Container from '#ui/Container';
import type { CoverEditionMobileScreenQuery } from '@azzapp/relay/artifacts/CoverEditionMobileScreenQuery.graphql';
import type { CoverEditionScreen_viewer$key } from '@azzapp/relay/artifacts/CoverEditionScreen_viewer.graphql';
import type { PreloadedQuery } from 'react-relay';

type CoverEditionMobileScreenProps = {
  isCreation?: boolean;
  preloadedQuery: PreloadedQuery<CoverEditionMobileScreenQuery>;
};

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

export default CoverEditionMobileScreen;
