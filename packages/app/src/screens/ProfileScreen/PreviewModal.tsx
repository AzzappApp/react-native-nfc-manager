import { Suspense, useState } from 'react';
import { useIntl } from 'react-intl';
import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment } from 'react-relay';
import { useModulesData } from '#components/cardModules/ModuleData';
import SwitchToggle from '#components/SwitchToggle';
import WebCardRenderer, {
  DESKTOP_PREVIEW_WIDTH,
} from '#components/WebCardRenderer';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { PreviewModal_viewer$key } from '@azzapp/relay/artifacts/PreviewModal_viewer.graphql';

import type { LayoutChangeEvent } from 'react-native';

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

  const intl = useIntl();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');
  const insets = useSafeAreaInsets();
  const [containerDimensions, setContainerDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  const onContainerLayout = (event: LayoutChangeEvent) => {
    setContainerDimensions(event.nativeEvent.layout);
  };
  const scale =
    viewMode === 'mobile'
      ? 1
      : containerDimensions.width / DESKTOP_PREVIEW_WIDTH;

  const webCardWidth =
    viewMode === 'mobile' ? containerDimensions.width : DESKTOP_PREVIEW_WIDTH;
  const webCardHeight = containerDimensions.height / scale;
  const topInset = Math.max(insets.top, 16);
  const bottomInset = Math.max(insets.bottom, 16);
  const cardModules = useModulesData(profile?.cardModules ?? []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <Container
        style={[{ flex: 1, paddingTop: topInset, paddingBottom: bottomInset }]}
      >
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
          <View style={[{ flex: 1 }]}>
            <Container style={{ padding: 8 }}>
              <SwitchToggle
                value={viewMode}
                onChange={setViewMode}
                values={[
                  {
                    value: 'mobile',
                    label: intl.formatMessage({
                      defaultMessage: 'Mobile',
                      description: 'Mobile view mode title in web card preview',
                    }),
                  },
                  {
                    value: 'desktop',
                    label: intl.formatMessage({
                      defaultMessage: 'Desktop',
                      description:
                        'Desktop view mode title in web card preview',
                    }),
                  },
                ]}
              />
            </Container>
            <View style={{ flex: 1 }} onLayout={onContainerLayout}>
              <View
                style={{
                  width: webCardWidth,
                  height: webCardHeight,
                  transform: [
                    {
                      translateX:
                        (containerDimensions.width - webCardWidth) / 2,
                    },
                    {
                      translateY:
                        (containerDimensions.height - webCardHeight) / 2,
                    },
                    { scale },
                  ],
                }}
              >
                <WebCardRenderer
                  profile={profile}
                  viewMode={viewMode}
                  cardStyle={profile.cardStyle}
                  cardColors={profile.cardColors}
                  style={{ flex: 1 }}
                  cardModules={cardModules}
                />
              </View>
            </View>
          </View>
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
