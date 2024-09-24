import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  type SharedValue,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import {
  HORIZONTAL_PHOTO_MAX_HORIZONTAL_MARGIN,
  HORIZONTAL_PHOTO_MAX_VERTICAL_MARGIN,
} from '@azzapp/shared/cardModuleHelpers';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type HorizontalPhotoMarginsEditionPanelProps = ViewProps & {
  /**
   * The marginHorizontal currently set on the module
   */
  marginHorizontal: SharedValue<number>;
  /**
   * The marginVertical currently set on the module
   */
  marginVertical: SharedValue<number>;

  onTouched: () => void;
};

/**
 * Panel to edit the style of the HorizontalPhoto
 */
const HorizontalPhotoMarginsEditionPanel = ({
  marginHorizontal,
  marginVertical,
  onTouched,
  style,
  ...props
}: HorizontalPhotoMarginsEditionPanelProps) => {
  const intl = useIntl();

  const [fullWidth, setFullWidth] = useState(marginHorizontal.value === 0);

  useAnimatedReaction(
    () => {
      return marginHorizontal.value;
    },
    (currentValue, previousValue) => {
      if (
        (previousValue === 0 && currentValue !== 0) ||
        (previousValue !== 0 && currentValue === 0)
      ) {
        runOnJS(setFullWidth)(currentValue === 0);
      }
    },
    [],
  );

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
              defaultMessage="Top/bottom margin:"
              description="Top/bottom margin message in HorizontalPhoto edition"
            />
          }
          value={marginVertical}
          min={0}
          max={HORIZONTAL_PHOTO_MAX_VERTICAL_MARGIN}
          step={1}
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
          onTouched={onTouched}
        />
        <LabeledDashedSlider
          label={
            fullWidth ? (
              <FormattedMessage
                defaultMessage="Left/right margin: 0 - Full Width"
                description="Left/right margin message in Horizontal Photo edition"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Left/right margin:"
                description="Left/right margin message in Horizontal Photo edition"
              />
            )
          }
          formatValue={value => {
            'worklet';
            if (value === 0) {
              return '';
            }
            return value;
          }}
          value={marginHorizontal}
          min={0}
          max={HORIZONTAL_PHOTO_MAX_HORIZONTAL_MARGIN}
          step={1}
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
          onTouched={onTouched}
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
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
