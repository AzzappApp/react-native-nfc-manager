import { Suspense } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { useModulesData } from '#components/cardModules/ModuleData';
import ScreenModal from '#components/ScreenModal';
import WebCardPreview from '#components/WebCardPreview';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { PreviewModal_webCard$key } from '#relayArtifacts/PreviewModal_webCard.graphql';

type PreviewModalProps = {
  webCard: PreviewModal_webCard$key;
  /**
   * Whether the modal is visible.
   */
  visible: boolean;
  /**
   * Callback fired when the modal request to be closed.
   */
  onRequestClose: () => void;
};

/**
 * A modal that allows the user to preview his webcard.
 */
const PreviewModal = ({
  webCard: webCardKey,
  visible,
  onRequestClose,
}: PreviewModalProps) => {
  const webCard = useFragment(
    graphql`
      fragment PreviewModal_webCard on WebCard {
        id
        ...CoverRenderer_webCard
        ...WebCardBackgroundPreview_webCard
        ...WebCardBackground_webCard
        cardStyle {
          borderColor
          borderRadius
          buttonRadius
          borderWidth
          buttonColor
          fontFamily
          fontSize
          gap
          titleFontFamily
          titleFontSize
        }
        cardModules {
          id
          visible
          ...ModuleData_cardModules
        }
        cardColors {
          primary
          dark
          light
        }
      }
    `,
    webCardKey,
  );

  const cardModules = useModulesData(webCard?.cardModules ?? [], true);

  const intl = useIntl();

  const { height: windowHeight } = useWindowDimensions();
  const insets = useScreenInsets();

  const previewHeight = windowHeight - insets.top - HEADER_HEIGHT;

  return (
    <ScreenModal visible={visible} animationType="slide">
      <Container style={{ flex: 1, paddingTop: insets.top }}>
        <Header
          leftElement={
            <IconButton
              icon="arrow_down"
              onPress={onRequestClose}
              iconSize={28}
              variant="icon"
            />
          }
          middleElement={intl.formatMessage({
            defaultMessage: 'Preview',
            description: 'Preview modal title',
          })}
        />
        <Suspense
          fallback={
            <View style={styles.activityIndicatorContainer}>
              <ActivityIndicator />
            </View>
          }
        >
          <WebCardPreview
            webCard={webCard}
            height={previewHeight}
            cardStyle={webCard.cardStyle}
            cardColors={webCard.cardColors}
            style={{ flex: 1 }}
            cardModules={cardModules}
            contentPaddingBottom={insets.bottom}
          />
        </Suspense>
      </Container>
    </ScreenModal>
  );
};

export default PreviewModal;

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 200,
  },
});
