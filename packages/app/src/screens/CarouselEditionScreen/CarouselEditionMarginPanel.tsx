import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  CAROUSEL_MAX_GAP,
  CAROUSEL_MAX_HORIZONTAL_MARGIN,
  CAROUSEL_MAX_VERTICAL_MARGIN,
} from '@azzapp/shared/cardModuleHelpers';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type CarouselEditionMarginPanelProps = ViewProps & {
  /**
   * The horizontal margin currently set on the module
   */
  gap: SharedValue<number>;
  /**
   * The vertical margin currently set on the module
   */
  marginVertical: SharedValue<number>;
  /**
   * The horizontal margin currently set on the module
   */
  marginHorizontal: SharedValue<number>;

  onTouched: () => void;
};

/**
 * A panel to edit the margins of the carousel module
 */
const CarouselEditionMarginPanel = ({
  gap,
  marginVertical,
  marginHorizontal,
  onTouched,
  style,
  ...props
}: CarouselEditionMarginPanelProps) => {
  const intl = useIntl();

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
              defaultMessage="Top/Bottom margin :"
              description="Margin vertical label in carousel edition"
            />
          }
          value={marginVertical}
          min={0}
          max={CAROUSEL_MAX_VERTICAL_MARGIN}
          step={1}
          onTouched={onTouched}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Left margin :"
              description="Margin horizontal label in carousel edition"
            />
          }
          value={marginHorizontal}
          min={0}
          max={CAROUSEL_MAX_HORIZONTAL_MARGIN}
          step={1}
          onTouched={onTouched}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Gap :"
              description="Image gap label in carousel edition"
            />
          }
          value={gap}
          min={0}
          max={CAROUSEL_MAX_GAP}
          step={1}
          onTouched={onTouched}
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
