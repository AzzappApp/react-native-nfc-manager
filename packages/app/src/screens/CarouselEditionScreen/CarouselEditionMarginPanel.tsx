import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type CarouselEditionMarginPanelProps = ViewProps & {
  /**
   * The horizontal margin currently set on the module
   */
  gap: number;
  /**
   * The vertical margin currently set on the module
   */
  marginVertical: number;
  /**
   * The horizontal margin currently set on the module
   */
  marginHorizontal: number;
  /**
   * A callback called when the user update the horizontal margin
   */
  onGapChange: (gap: number) => void;
  /**
   * A callback called when the user update the vertical margin
   */
  onMarginVerticalChange: (marginVertical: number) => void;
  /**
   * A callback called when the user update the horizontal margin
   */
  onMarginHorizontalChange: (marginHorizontal: number) => void;
};

/**
 * A panel to edit the margins of the carousel module
 */
const CarouselEditionMarginPanel = ({
  gap,
  marginVertical,
  marginHorizontal,
  onMarginVerticalChange,
  onMarginHorizontalChange,
  onGapChange,
  style,
  ...props
}: CarouselEditionMarginPanelProps) => {
  const intl = useIntl();
  const { width: windowWidth } = useWindowDimensions();

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Margins',
          description: 'Title of the margins section in carousel edition',
        })}
      />
      <View style={styles.content}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Top/Bottom margin : {size}"
              description="Margin vertical label in carousel edition"
              values={{
                size: marginVertical,
              }}
            />
          }
          value={marginVertical}
          min={0}
          max={100}
          step={1}
          onChange={onMarginVerticalChange}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Left margin : {size}"
              description="Margin horizontal label in carousel edition"
              values={{
                size: marginHorizontal,
              }}
            />
          }
          value={marginHorizontal}
          min={0}
          max={100}
          step={1}
          onChange={onMarginHorizontalChange}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Gap : {size}"
              description="Image gap label in carousel edition"
              values={{ size: gap }}
            />
          }
          value={gap}
          min={0}
          max={100}
          step={1}
          onChange={onGapChange}
          style={styles.slider}
        />
      </View>
    </View>
  );
};

export default CarouselEditionMarginPanel;

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
