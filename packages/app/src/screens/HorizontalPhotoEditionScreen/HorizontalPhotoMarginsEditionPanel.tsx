import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type HorizontalPhotoMarginsEditionPanelProps = ViewProps & {
  /**
   * The marginHorizontal currently set on the module
   */
  marginHorizontal: number;
  /**
   * A callback called when the user update the marginHorizontal
   */
  onMarginHorizontalChange: (marginHorizontal: number) => void;

  /**
   * The marginVertical currently set on the module
   */
  marginVertical: number;
  /**
   * A callback called when the user update the marginVertical
   */
  onMarginVerticalChange: (marginVertical: number) => void;

  /**
   * The height currently set on the module
   */
  height: number;
  /**
   * A callback called when the user update the height
   */
  onHeightChange: (height: number) => void;
};

/**
 * Panel to edit the style of the HorizontalPhoto
 */
const HorizontalPhotoMarginsEditionPanel = ({
  marginHorizontal,
  onMarginHorizontalChange,
  marginVertical,
  onMarginVerticalChange,
  height,
  onHeightChange,
  style,
  ...props
}: HorizontalPhotoMarginsEditionPanelProps) => {
  const intl = useIntl();
  const windowWidth = useWindowDimensions().width;
  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Margins',
          description:
            'Title of the margins section in HorizontalPhoto edition',
        })}
      />
      <View style={styles.paramContainer}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Top/bottom margin: {size}"
              description="Top/bottom margin message in HorizontalPhoto edition"
              values={{
                size: marginVertical,
              }}
            />
          }
          value={marginVertical}
          min={0}
          max={100}
          step={1}
          interval={Math.floor((windowWidth - 80) / 60)}
          onChange={onMarginVerticalChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Top/bottom margin size',
            description:
              'Label of the Top/bottom margin size slider in HorizontalPhoto edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Top/bottom marginsize',
            description:
              'Hint of the Top/bottom margin slider in HorizontalPhoto edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Left/right margin: {size}"
              description="Left/right margin message in Horizontal Photo edition"
              values={{
                size: marginHorizontal,
              }}
            />
          }
          value={marginHorizontal}
          min={0}
          max={100}
          step={1}
          interval={Math.floor((windowWidth - 80) / 60)}
          onChange={onMarginHorizontalChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Left/right margin size',
            description:
              'Label of the Left/right margin size slider in HorizontalPhoto edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Left/right margin size',
            description:
              'Hint of the Left/right margin slider in HorizontalPhoto edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Height: {size}"
              description="Height message in HorizontalPhoto edition"
              values={{
                size: height,
              }}
            />
          }
          value={height}
          min={50}
          max={400}
          step={1}
          interval={Math.floor((windowWidth - 80) / 60)}
          onChange={onHeightChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Height size',
            description:
              'Label of the Height size slider in HorizontalPhoto edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the height size',
            description: 'Hint of the height slider in HorizontalPhoto edition',
          })}
          style={styles.slider}
        />
      </View>
    </View>
  );
};

export default HorizontalPhotoMarginsEditionPanel;

const styles = StyleSheet.create({
  paramContainer: { flex: 1, justifyContent: 'center', rowGap: 25 },
  root: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    rowGap: 15,
    justifyContent: 'center',
  },
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: 15,
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
