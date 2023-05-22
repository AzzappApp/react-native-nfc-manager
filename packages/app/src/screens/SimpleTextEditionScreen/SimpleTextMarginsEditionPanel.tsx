import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import DashedSlider from '#ui/DashedSlider';
import Text from '#ui/Text';
import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type SimpleTextMarginEditionPanelProps = ViewProps & {
  /**
   * The horizontal margin currently set on the module
   */
  marginHorizontal: number;
  /**
   * The vertical margin currently set on the module
   */
  marginVertical: number;
  /**
   * A callback called when the user update the horizontal margin
   */
  onMarginHorizontalChange: (marginHorizontal: number) => void;
  /**
   * A callback called when the user update the vertical margin
   */
  onMarginVerticalChange: (marginVertical: number) => void;
};

/**
 * A panel to edit the margins of the simple text module
 */
const SimpleTextMarginEditionPanel = ({
  marginHorizontal,
  marginVertical,
  onMarginVerticalChange,
  onMarginHorizontalChange,
  style,
  ...props
}: SimpleTextMarginEditionPanelProps) => {
  const intl = useIntl();
  const { width: windowWidth } = useWindowDimensions();

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Margins',
          description: 'Title of the margins section in simple text edition',
        })}
      />
      <View style={styles.content}>
        <View style={styles.sliderContainer}>
          <Text variant="small" style={[styles.sliderTitle]}>
            <FormattedMessage
              defaultMessage="Margin top/bottom : {size}"
              description="Font size message in cover edition"
              values={{
                size: marginVertical,
              }}
            />
          </Text>
          <DashedSlider
            value={marginVertical}
            min={0}
            max={60}
            step={1}
            interval={Math.floor((windowWidth - 80) / 60)}
            onChange={onMarginVerticalChange}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Margin size',
              description: 'Label of the font size slider in cover edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Slide to change the font size',
              description: 'Hint of the font size slider in cover edition',
            })}
            style={{ width: '90%' }}
          />
        </View>
        <View style={styles.sliderContainer}>
          <Text variant="small" style={[styles.sliderTitle]}>
            <FormattedMessage
              defaultMessage="Margin left/right : {size}"
              description="Font size message in cover edition"
              values={{
                size: marginHorizontal,
              }}
            />
          </Text>
          <DashedSlider
            value={marginHorizontal}
            min={0}
            max={60}
            step={1}
            interval={Math.floor((windowWidth - 80) / 60)}
            onChange={onMarginHorizontalChange}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Margin size',
              description: 'Label of the font size slider in cover edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Slide to change the font size',
              description: 'Hint of the font size slider in cover edition',
            })}
            style={{ width: '90%' }}
          />
        </View>
      </View>
    </View>
  );
};

export default SimpleTextMarginEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  content: {
    marginTop: 20,
    flex: 1,
    justifyContent: 'space-around',
  },
  sliderContainer: {
    overflow: 'hidden',
    marginBottom: 10,
    rowGap: 10,
  },
  sliderTitle: {
    marginTop: 4,
    alignSelf: 'center',
  },
});
