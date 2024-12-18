import { useState, useMemo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  HORIZONTAL_PHOTO_MAX_BORDER_RADIUS,
  HORIZONTAL_PHOTO_MAX_BORDER_WIDTH,
} from '@azzapp/shared/cardModuleHelpers';
import WebCardColorPicker from '#components/WebCardColorPicker';
import ColorPreview from '#ui/ColorPreview';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import type { HorizontalPhotoBorderEditionPanel_webCard$key } from '#relayArtifacts/HorizontalPhotoBorderEditionPanel_webCard.graphql';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type HorizontalPhotoBorderEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  webCard: HorizontalPhotoBorderEditionPanel_webCard$key | null;
  /**
   * The borderWidth currently set on the module
   */
  borderWidth: SharedValue<number>;
  /**
   * The borderRadius currently set on the module
   */
  borderRadius: SharedValue<number>;
  /**
   * The borderColor currently set on the module
   */
  borderColor: string;
  /**
   * A callback called when the user update the borderColor
   */
  onBorderColorChange: (borderColor: string) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;

  onTouched: () => void;
};

/**
 * Panel to edit the style of the HorizontalPhoto
 */
const HorizontalPhotoBorderEditionPanel = ({
  borderWidth,
  borderRadius,
  borderColor,
  onBorderColorChange,
  webCard: webCardKey,
  bottomSheetHeight,
  style,
  onTouched,
  ...props
}: HorizontalPhotoBorderEditionPanelProps) => {
  const intl = useIntl();

  const [currentTab, setCurrentTab] = useState<string>('border');
  const webCard = useFragment(
    graphql`
      fragment HorizontalPhotoBorderEditionPanel_webCard on WebCard {
        ...WebCardColorPicker_webCard
        cardColors {
          primary
          dark
          light
        }
      }
    `,
    webCardKey,
  );

  const onProfileColorPickerClose = useCallback(() => {
    setCurrentTab('border');
  }, [setCurrentTab]);

  const tabs = useMemo(
    () =>
      convertToNonNullArray([
        {
          tabKey: 'border',
          label: intl.formatMessage({
            defaultMessage: 'Border shape',
            description: 'Border shape tab label in HorizontalPhoto edition',
          }),
        },
        {
          tabKey: 'color',
          label: intl.formatMessage({
            defaultMessage: 'Border color',
            description: 'Border color tab label in HorizontalPhoto edition',
          }),
          rightElement: (
            <ColorPreview
              color={swapColor(borderColor, webCard?.cardColors)}
              style={{ marginLeft: 5 }}
            />
          ),
        },
      ]),
    [borderColor, intl, webCard?.cardColors],
  );

  return (
    <View {...props} style={[styles.root, style]}>
      <TabsBar currentTab={currentTab} onTabPress={setCurrentTab} tabs={tabs} />
      <View style={styles.paramContainer}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border size:"
              description="Border size message in Horizontal Photo edition"
            />
          }
          value={borderWidth}
          min={0}
          max={HORIZONTAL_PHOTO_MAX_BORDER_WIDTH}
          step={1}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border size',
            description:
              'Label of the Border size slider in HorizontalPhoto edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Border size',
            description:
              'Hint of the Border size slider in HorizontalPhoto edition',
          })}
          style={styles.slider}
          onTouched={onTouched}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border radius:"
              description="Border radius message in Horizontal Photo edition"
            />
          }
          value={borderRadius}
          min={0}
          max={HORIZONTAL_PHOTO_MAX_BORDER_RADIUS}
          step={1}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Image border radius size',
            description:
              'Label of the Border radius size slider in HorizontalPhoto edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the image border radius size',
            description:
              'Hint of the Border radius slider in HorizontalPhoto edition',
          })}
          style={styles.slider}
          onTouched={onTouched}
        />
        {webCard && (
          <WebCardColorPicker
            visible={currentTab !== 'border'}
            height={bottomSheetHeight}
            webCard={webCard}
            title={intl.formatMessage({
              defaultMessage: 'Border color',
              description: 'Border color title in HorizontalPhoto edition',
            })}
            selectedColor={borderColor}
            onColorChange={onBorderColorChange}
            onRequestClose={onProfileColorPickerClose}
          />
        )}
      </View>
    </View>
  );
};

export default HorizontalPhotoBorderEditionPanel;

const styles = StyleSheet.create({
  paramContainer: { flex: 1, justifyContent: 'center', rowGap: 25 },
  root: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
