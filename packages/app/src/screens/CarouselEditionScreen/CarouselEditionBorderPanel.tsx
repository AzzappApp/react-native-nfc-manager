import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  CAROUSEL_MAX_BORDER_RADIUS,
  CAROUSEL_MAX_BORDER_WIDTH,
} from '@azzapp/shared/cardModuleHelpers';
import WebCardColorPicker from '#components/WebCardColorPicker';
import ColorPreview from '#ui/ColorPreview';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import type { CarouselEditionBorderPanel_webCard$key } from '#relayArtifacts/CarouselEditionBorderPanel_webCard.graphql';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type CarouselEditionBorderPanelProps = Omit<ViewProps, 'children'> & {
  /**
   * The size of the border.
   */
  borderWidth: SharedValue<number>;
  /**
   * The color of the border.
   */
  borderColor: string;
  /**
   * The radius of the border.
   */
  borderRadius: SharedValue<number>;
  /**
   * The height of the bottom sheet.
   */
  bottomSheetHeight: number;
  /**
   * The current webCard. used for the color picker.
   */
  webCard: CarouselEditionBorderPanel_webCard$key | null;
  /**
   * Called when the user wants to change the border color.
   */
  onBorderColorChange: (borderColor: string) => void;

  onTouched: () => void;
};

/**
 * A panel to edit the border of the carousel.
 */
const CarouselEditionBorderPanel = ({
  webCard: webCardKey,
  borderWidth,
  borderColor,
  borderRadius,
  bottomSheetHeight,
  onBorderColorChange,
  style,
  onTouched,
  ...props
}: CarouselEditionBorderPanelProps) => {
  const [currentTab, setCurrentTab] = useState<string>('size');

  const webCard = useFragment(
    graphql`
      fragment CarouselEditionBorderPanel_webCard on WebCard {
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
    setCurrentTab('size');
  }, [setCurrentTab]);

  const intl = useIntl();

  const tabs = useMemo(
    () => [
      {
        tabKey: 'size',
        label: intl.formatMessage({
          defaultMessage: 'Border shape',
          description: 'Title of the border shape section in carousel edition',
        }),
      },
      {
        tabKey: 'color',
        label: intl.formatMessage({
          defaultMessage: 'Border color',
          description: 'Title of the border color section in carousel edition',
        }),
        rightElement: (
          <ColorPreview
            color={swapColor(borderColor, webCard?.cardColors)}
            style={{ marginLeft: 5 }}
          />
        ),
      },
    ],
    [borderColor, intl, webCard?.cardColors],
  );

  return (
    <View {...props} style={[styles.root, style]}>
      <TabsBar currentTab={currentTab} onTabPress={setCurrentTab} tabs={tabs} />
      <View style={styles.content}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border size :"
              description="Border size message in carousel edition"
            />
          }
          value={borderWidth}
          min={0}
          max={CAROUSEL_MAX_BORDER_WIDTH}
          step={1}
          onTouched={onTouched}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border size',
            description: 'Label of the border size in carousel edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the border size',
            description: 'Hint of the border size slider in carousel edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border radius :"
              description="Border radius in carousel edition"
            />
          }
          value={borderRadius}
          onTouched={onTouched}
          min={0}
          max={CAROUSEL_MAX_BORDER_RADIUS}
          step={1}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border radius',
            description: 'Label of the border radius in carousel edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the border radius',
            description: 'Hint of the border radius slider in carousel edition',
          })}
          style={styles.slider}
        />
      </View>
      {webCard && (
        <WebCardColorPicker
          visible={currentTab !== 'size'}
          height={bottomSheetHeight}
          webCard={webCard}
          title={intl.formatMessage({
            defaultMessage: 'Border color',
            description: 'Title of the border color picker in carousel edition',
          })}
          selectedColor={borderColor}
          onColorChange={onBorderColorChange}
          onRequestClose={onProfileColorPickerClose}
        />
      )}
    </View>
  );
};

export default CarouselEditionBorderPanel;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  content: {
    marginTop: 20,
    flex: 1,
    justifyContent: 'center',
    rowGap: 15,
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
