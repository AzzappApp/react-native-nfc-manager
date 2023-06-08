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
   * The image height currently set on the module
   */
  imageHeight: number;
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
  /**
   * A callback called when the user update the image height
   */
  onImageHeightChange: (value: number) => void;
};

/**
 * A panel to edit the margins of the carousel module
 */
const CarouselEditionMarginPanel = ({
  gap,
  marginVertical,
  marginHorizontal,
  imageHeight,
  onMarginVerticalChange,
  onMarginHorizontalChange,
  onGapChange,
  onImageHeightChange,
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
              defaultMessage="Images height : {size}"
              description="Images height label in carousel edition"
              values={{ size: imageHeight }}
            />
          }
          value={imageHeight}
          min={40}
          max={600}
          step={5}
          interval={Math.floor((windowWidth - 80) / 60)}
          onChange={onImageHeightChange}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Margin top/bottom : {size}"
              description="Margin vertical label in carousel edition"
              values={{
                size: marginVertical,
              }}
            />
          }
          value={marginVertical}
          min={0}
          max={60}
          step={1}
          interval={Math.floor((windowWidth - 80) / 60)}
          onChange={onMarginVerticalChange}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Margin left/right : {size}"
              description="Margin horizontal label in carousel edition"
              values={{
                size: marginHorizontal,
              }}
            />
          }
          value={marginHorizontal}
          min={0}
          max={60}
          step={1}
          interval={Math.floor((windowWidth - 80) / 60)}
          onChange={onMarginHorizontalChange}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Image gap : {size}"
              description="Image gap label in carousel edition"
              values={{ size: gap }}
            />
          }
          value={gap}
          min={0}
          max={60}
          step={1}
          interval={Math.floor((windowWidth - 80) / 60)}
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
