import { useState, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  SIMPLE_BUTTON_MAX_BORDER_RADIUS,
  SIMPLE_BUTTON_MAX_BORDER_WIDTH,
} from '@azzapp/shared/cardModuleHelpers';
import WebCardColorPicker from '#components/WebCardColorPicker';
import ColorPreview from '#ui/ColorPreview';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import type { SimpleButtonBordersEditionPanel_webCard$key } from '#relayArtifacts/SimpleButtonBordersEditionPanel_webCard.graphql';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type SimpleButtonBordersEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  webCard: SimpleButtonBordersEditionPanel_webCard$key | null;
  /**
   * The borderColor currently set on the module
   */
  borderColor: string;
  /**
   * A callback called when the user update the borderColor
   */
  onBorderColorChange: (borderColor: string) => void;
  /**
   * The borderWidth currently set on the module
   */
  borderWidth: SharedValue<number>;
  /**
   * The borderRadius currently set on the module
   */
  borderRadius: SharedValue<number>;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;

  onTouched: () => void;
};

/**
 * A Panel to edit the Borders of the SimpleButton edition screen
 */
const SimpleButtonBordersEditionPanel = ({
  webCard: webCardKey,
  borderColor,
  onBorderColorChange,
  borderWidth,
  borderRadius,
  style,
  bottomSheetHeight,
  onTouched,
  ...props
}: SimpleButtonBordersEditionPanelProps) => {
  const intl = useIntl();

  const [currentTab, setCurrentTab] = useState<string>('borders');
  const webCard = useFragment(
    graphql`
      fragment SimpleButtonBordersEditionPanel_webCard on WebCard {
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
    setCurrentTab('borders');
  }, [setCurrentTab]);

  const tabs = useMemo(
    () =>
      convertToNonNullArray([
        {
          tabKey: 'borders',
          label: intl.formatMessage({
            defaultMessage: 'Border shape',
            description: 'Border Shape tab label in SimpleButton edition',
          }),
        },
        {
          tabKey: 'color',
          label: intl.formatMessage({
            defaultMessage: 'Border color',
            description: 'Border color tab label in SimpleButton edition',
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
    <View style={[styles.root, style]} {...props}>
      <View style={styles.paramContainer}>
        <TabsBar
          currentTab={currentTab}
          onTabPress={setCurrentTab}
          tabs={tabs}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border size :"
              description="borderWidth message in SimpleButton edition"
            />
          }
          value={borderWidth}
          min={0}
          max={SIMPLE_BUTTON_MAX_BORDER_WIDTH}
          step={1}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border width',
            description:
              'Label of the border Width slider in SimpleButton edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the border Width',
            description:
              'Hint of the border Width slider in SimpleButton edition',
          })}
          style={styles.slider}
          onTouched={onTouched}
        />

        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border radius :"
              description="border radius message in SimpleButton edition"
            />
          }
          value={borderRadius}
          min={0}
          max={SIMPLE_BUTTON_MAX_BORDER_RADIUS}
          step={1}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border Radius',
            description:
              'Label of the borderRadius slider in SimpleButton edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the border Radius',
            description:
              'Hint of the borderRadius slider in SimpleButton edition',
          })}
          style={styles.slider}
          onTouched={onTouched}
        />
      </View>
      {webCard && (
        <WebCardColorPicker
          visible={currentTab !== 'borders'}
          height={bottomSheetHeight}
          webCard={webCard}
          title={intl.formatMessage({
            defaultMessage: 'Border color',
            description: 'Bordercolor color title in SimpleButton edition',
          })}
          selectedColor={borderColor}
          onColorChange={onBorderColorChange}
          onRequestClose={onProfileColorPickerClose}
        />
      )}
    </View>
  );
};

export default SimpleButtonBordersEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  paramContainer: {
    width: '100%',
    rowGap: 25,
    justifyContent: 'flex-end',
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
