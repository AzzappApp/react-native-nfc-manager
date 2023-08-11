import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';

import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native';

type SocialLinksMarginsEditionPanelProps = ViewProps & {
  /**
   * The marginTop currently set on the module
   */
  marginTop: number;
  /**
   * A callback called when the user update the marginTop
   */
  onMarginTopChange: (marginTop: number) => void;
  /**
   * The marginBottom currently set on the module
   */
  marginBottom: number;
  /**
   * A callback called when the user update the marginBottom
   */
  onMarginBottomChange: (marginBottom: number) => void;
  /**
   * The marginHorizontal currently set on the module
   */
  marginHorizontal: number;
  /**
   * A callback called when the user update the marginHorizontal
   */
  onMarginHorizontalChange: (marginRight: number) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
};

/**
 * A Panel to edit the Margins of the SocialLinks edition screen
 */
const SocialLinksMarginsEditionPanel = ({
  marginTop,
  onMarginTopChange,
  marginBottom,
  onMarginBottomChange,
  marginHorizontal,
  onMarginHorizontalChange,
  style,
  ...props
}: SocialLinksMarginsEditionPanelProps) => {
  const intl = useIntl();

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Margins',
          description: 'Title of the Margins section in SocialLinks edition',
        })}
      />
      <View style={styles.paramContainer}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Top margin : {size}"
              description="Top margin message in SocialLinks edition"
              values={{
                size: marginTop,
              }}
            />
          }
          value={marginTop}
          min={10}
          max={100}
          step={1}
          onChange={onMarginTopChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Top margin',
            description:
              'Label of the Top margin slider in SocialLinks edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Top margin',
            description: 'Hint of the Top margin slider in SocialLinks edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Bottom margin : {size}"
              description="Bottom margin message in SocialLinks edition"
              values={{
                size: marginBottom,
              }}
            />
          }
          value={marginBottom}
          min={10}
          max={100}
          step={1}
          onChange={onMarginBottomChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Bottom margin',
            description:
              'Label of the Bottom margin slider in SocialLinks edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Bottom margin',
            description:
              'Hint of the Bottom margin slider in SocialLinks edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Horizontal margin : {size}"
              description="Horizontal margin message in SocialLinks edition"
              values={{
                size: marginHorizontal,
              }}
            />
          }
          value={marginHorizontal}
          min={10}
          max={100}
          step={1}
          onChange={onMarginHorizontalChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Horizontal margin',
            description:
              'Label of the horizontal margin slider in SocialLinks edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the horizontal margin',
            description:
              'Hint of the horizontal margin slider in SocialLinks edition',
          })}
          style={styles.slider}
        />
      </View>
    </View>
  );
};

export default SocialLinksMarginsEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  paramContainer: {
    width: '100%',
    flex: 1,
    rowGap: 25,
    justifyContent: 'center',
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
