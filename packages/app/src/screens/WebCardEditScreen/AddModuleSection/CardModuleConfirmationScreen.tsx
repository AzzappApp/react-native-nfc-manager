import { ResizeMode, Video } from 'expo-av';
import { FormattedMessage, useIntl } from 'react-intl';
import { Appearance, StyleSheet, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { getRouteForCardModule } from '#helpers/cardModuleRouterHelpers';
import { getCurrentLocale } from '#helpers/localeHelpers';
import relayScreen from '#helpers/relayScreen';
import useVariantLabel from '#hooks/useModuleVariantsLabel';
import useScreenInsets from '#hooks/useScreenInsets';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import Button from '#ui/Button';
import Container from '#ui/Container';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CardModuleConfirmationScreenQuery } from '#relayArtifacts/CardModuleConfirmationScreenQuery.graphql';
import type { ModulePreviewRoute } from '#routes';

const cardModuleConfirmationScreenQuery = graphql`
  query CardModuleConfirmationScreenQuery(
    $webCardId: ID!
    $module: String!
    $variant: String
    $colorScheme: String
    $locale: String
    $portraitHeight: Int!
    $portraitWidth: Int!
    $landscapeHeight: Int!
    $landscapeWidth: Int!
    $pixelRatio: Float
  ) {
    node(id: $webCardId) {
      ... on WebCard {
        moduleVideoPreview(
          module: $module
          variant: $variant
          colorScheme: $colorScheme
          locale: $locale
          portraitHeight: $portraitHeight
          portraitWidth: $portraitWidth
          landscapeHeight: $landscapeHeight
          landscapeWidth: $landscapeWidth
          pixelRatio: $pixelRatio
        ) {
          landscape
          portrait
        }
      }
    }
  }
`;

const CardModuleConfirmationScreen = ({
  route: {
    params: { variant },
  },
  preloadedQuery,
}: RelayScreenProps<ModulePreviewRoute, CardModuleConfirmationScreenQuery>) => {
  const intl = useIntl();
  const insets = useScreenInsets();
  const label = useVariantLabel(variant);

  const data = usePreloadedQuery(
    cardModuleConfirmationScreenQuery,
    preloadedQuery,
  );
  const moduleVideoPreview = data?.node?.moduleVideoPreview;

  const router = useRouter();
  const onClose = () => {
    router.back();
  };
  const onConfirm = () => {
    const route = getRouteForCardModule({ ...variant, isNew: true });
    if (route) {
      router.replace(route);
    }
  };

  return (
    <Container style={[styles.container, { padding: insets.top + 20 }]}>
      <View style={styles.headerContainer}>
        <View style={styles.close}>
          <IconButton
            icon="close"
            iconStyle={styles.closeIcon}
            variant="icon"
            onPress={onClose}
            style={styles.closeIconContainer}
            hitSlop={{ top: 12, left: 12, bottom: 12, right: 12 }}
          />
        </View>
        <Text variant="large" style={styles.textHeader}>
          {label}
        </Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={styles.landscapePreviewContainer}>
            <Video
              source={{
                uri: moduleVideoPreview?.landscape || '',
              }}
              style={styles.landscapePreview}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              isMuted
              shouldPlay
            />
            <Text variant="small" style={styles.deviceDescription}>
              <FormattedMessage
                defaultMessage="Desktop"
                description="CardModuleConfirmationScreenModal - subtitle for desktop preview"
              />
            </Text>
          </View>
          <View style={styles.portraitPreviewContainer}>
            <Video
              source={{
                uri: moduleVideoPreview?.portrait || '',
              }}
              style={styles.portraitPreview}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              isMuted
              shouldPlay
            />

            <Text variant="small" style={styles.deviceDescription}>
              <FormattedMessage
                defaultMessage="Mobile"
                description="CardModuleConfirmationScreenModal - subtitle for Mobile preview"
              />
            </Text>
          </View>
        </View>
      </View>
      <View
        style={{
          marginBottom: insets.bottom,
          marginTop: 40,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          label={intl.formatMessage({
            defaultMessage: `Add this section`,
            description:
              'CardModuleConfirmationScreenModal - confirmation button',
          })}
          variant="secondary"
          appearance="light"
          style={styles.button}
          onPress={onConfirm}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  headerContainer: {
    paddingVertical: 20,
    width: '100%',
  },
  content: {
    height: '100%',
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  textHeader: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: colors.white,
    position: 'absolute',
  },
  closeIcon: {
    tintColor: colors.white,
    width: 24,
    height: 24,
  },
  closeIconContainer: {
    width: 24,
    height: 24,
  },
  close: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 1,
  },
  portraitPreviewContainer: {
    width: '30%',
    top: '55%',
    borderRadius: 16,
    alignSelf: 'center',
    position: 'absolute',
    aspectRatio: 114 / 184,
  },
  portraitPreview: {
    borderRadius: 16,
    aspectRatio: 114 / 184,
  },
  landscapePreviewContainer: {
    width: '100%',
    top: '15%',
    aspectRatio: 330 / 244,
  },
  landscapePreview: {
    borderRadius: 16,
    width: '100%',
    aspectRatio: 330 / 244,
  },
  button: {
    backgroundColor: colors.white,
  },
  deviceDescription: {
    top: 8,
    color: colors.white,
  },
});

export default relayScreen(CardModuleConfirmationScreen, {
  query: cardModuleConfirmationScreenQuery,
  getVariables: (route, webCard) => ({
    module: route.variant.moduleKind ?? '',
    variant: route.variant.variant ?? '',
    webCardId: webCard?.webCardId ?? '',
    colorScheme: Appearance.getColorScheme(),
    locale: getCurrentLocale(),
    portraitHeight: 184,
    portraitWidth: 114,
    landscapeHeight: 244,
    landscapeWidth: 330,
    pixelRatio: CappedPixelRatio(),
  }),
  getScreenOptions: () => ({
    stackAnimation: 'slide_from_bottom',
  }),
});
