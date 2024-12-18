import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  LINE_DIVIDER_MAX_MARGIN_BOTTOM,
  LINE_DIVIDER_MAX_MARGIN_TOP,
} from '@azzapp/shared/cardModuleHelpers';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type LineDividerMarginEditionPanelProps = ViewProps & {
  /**
   * The horizontal margin currently set on the module
   */
  marginBottom: SharedValue<number>;
  /**
   * The vertical margin currently set on the module
   */
  marginTop: SharedValue<number>;

  onTouched: () => void;
};

/**
 * A panel to edit the margins of Line Divider module
 */
const LineDividerMarginEditionPanel = ({
  marginBottom,
  marginTop,
  style,
  onTouched,
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
              defaultMessage="Top margin :"
              description="Top margin message in Line Divider edition"
            />
          }
          value={marginTop}
          min={0}
          max={LINE_DIVIDER_MAX_MARGIN_TOP}
          step={1}
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
          onTouched={onTouched}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Bottom margin :"
              description="Bottom margin message in Line Divider edition"
            />
          }
          value={marginBottom}
          min={0}
          max={LINE_DIVIDER_MAX_MARGIN_BOTTOM}
          step={1}
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
          onTouched={onTouched}
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
