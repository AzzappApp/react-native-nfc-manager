import { Suspense } from 'react';
import { useIntl } from 'react-intl';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment } from 'react-relay';
import { useModulesData } from '#components/cardModules/ModuleData';
import WebCardPreview from '#components/WebCardPreview';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { PreviewModal_viewer$key } from '@azzapp/relay/artifacts/PreviewModal_viewer.graphql';

type PreviewModalProps = {
  profile: PreviewModal_viewer$key;
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
  profile: profileKey,
  visible,
  onRequestClose,
}: PreviewModalProps) => {
  const profile = useFragment(
    graphql`
      fragment PreviewModal_viewer on Profile {
        id
        ...CoverRenderer_profile
        ...WebCardBackground_profile
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
    profileKey,
  );

  const cardModules = useModulesData(profile?.cardModules ?? []);

  const intl = useIntl();

  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 16);
  const bottomInset = Math.max(insets.bottom, 16);

  const previewHeight = windowHeight - topInset - HEADER_HEIGHT;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <Container style={{ flex: 1, paddingTop: topInset }}>
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
            profile={profile}
            height={previewHeight}
            cardStyle={profile.cardStyle}
            cardColors={profile.cardColors}
            style={{ flex: 1 }}
            cardModules={cardModules}
            contentPaddingBottom={bottomInset}
          />
        </Suspense>
      </Container>
    </Modal>
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
