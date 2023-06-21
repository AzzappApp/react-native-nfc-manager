import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type LineDividerMarginEditionPanelProps = ViewProps & {
  /**
   * The horizontal margin currently set on the module
   */
  marginBottom: number;
  /**
   * The vertical margin currently set on the module
   */
  marginTop: number;
  /**
   * A callback called when the user update the horizontal margin
   */
  onMarginBottomChange: (marginBottom: number) => void;
  /**
   * A callback called when the user update the vertical margin
   */
  onMarginTopChange: (marginTop: number) => void;
};

/**
 * A panel to edit the margins of Line Divider module
 */
const LineDividerMarginEditionPanel = ({
  marginBottom,
  marginTop,
  onMarginTopChange,
  onMarginBottomChange,
  style,
  ...props
}: LineDividerMarginEditionPanelProps) => {
  const intl = useIntl();

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Margins',
          description: 'Title of the margins section in Line Divider edition',
        })}
      />
      <View style={styles.content}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Top margin : {size}"
              description="Top margin message in Line Divider edition"
              values={{
                size: marginTop,
              }}
            />
          }
          value={marginTop}
          min={0}
          max={200}
          step={1}
          onChange={onMarginTopChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Top Margin size',
            description:
              'Label of the top margin size slider in Line Divider edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the top margin size',
            description:
              'Hint of the top margin slider in Line Divider edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Bottom margin : {size}"
              description="Bottom margin message in Line Divider edition"
              values={{
                size: marginBottom,
              }}
            />
          }
          value={marginBottom}
          min={0}
          max={200}
          step={1}
          onChange={onMarginBottomChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Bottom Margin size',
            description:
              'Label of the bottom margin size slider in Line Divider edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the bottom margin size',
            description:
              'Hint of the bottom margin slider in Line Divider edition',
          })}
          style={styles.slider}
        />
      </View>
    </View>
  );
};

export default LineDividerMarginEditionPanel;

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
