import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  PHOTO_WITH_TEXT_AND_TITLE_MAX_GAP,
  PHOTO_WITH_TEXT_AND_TITLE_MAX_HORIZONTAL_MARGIN,
  PHOTO_WITH_TEXT_AND_TITLE_MAX_VERTICAL_MARGIN,
} from '@azzapp/shared/cardModuleHelpers';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';

import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native';

type PhotoWithTextAndTitleMarginsEditionPanelProps = ViewProps & {
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
   * The gap currently set on the module
   */
  gap: number;
  /**
   * A callback called when the user update the gap
   */
  onGapChange: (gap: number) => void;
};

/**
 * A Panel to edit the Margins of the PhotoWithTextAndTitle edition screen
 */
const PhotoWithTextAndTitleMarginsEditionPanel = ({
  gap,
  onGapChange,
  marginHorizontal,
  onMarginHorizontalChange,
  marginVertical,
  onMarginVerticalChange,
  style,
  ...props
}: PhotoWithTextAndTitleMarginsEditionPanelProps) => {
  const intl = useIntl();
  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Margins',
          description:
            'Title of the Margins section in PhotoWithTextAndTitle edition',
        })}
      />
      <View style={styles.paramContainer}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Left/Right margin :"
              description="Left/Right message in PhotoWithTextAndTitle edition"
            />
          }
          initialValue={marginHorizontal}
          min={0}
          max={PHOTO_WITH_TEXT_AND_TITLE_MAX_HORIZONTAL_MARGIN}
          step={1}
          onChange={onMarginHorizontalChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Left/Right margin',
            description:
              'Label of the Left/Right margin slider in PhotoWithTextAndTitle edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Left/Right',
            description:
              'Hint of the Left/Right slider in PhotoWithTextAndTitle edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Top/Bottom margin :"
              description="Top/Bottom margin message in PhotoWithTextAndTitle edition"
            />
          }
          initialValue={marginVertical}
          min={0}
          max={PHOTO_WITH_TEXT_AND_TITLE_MAX_VERTICAL_MARGIN}
          step={1}
          onChange={onMarginVerticalChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Top/Bottom Margin',
            description:
              'Label of the Top/Bottom Margin slider in PhotoWithTextAndTitle edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Top/Bottom Margin',
            description:
              'Hint of the Top/Bottom Margin slider in PhotoWithTextAndTitle edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Image/Text Gap :"
              description="Image/Text Gap message in PhotoWithTextAndTitle edition"
            />
          }
          initialValue={gap}
          min={0}
          max={PHOTO_WITH_TEXT_AND_TITLE_MAX_GAP}
          step={1}
          onChange={onGapChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Image/Text Gap',
            description:
              'Label of the Image/Text Gap slider in PhotoWithTextAndTitle edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Image/Text Gap',
            description:
              'Hint of the Image/Text Gap slider in PhotoWithTextAndTitle edition',
          })}
          style={styles.slider}
        />
      </View>
    </View>
  );
};

export default PhotoWithTextAndTitleMarginsEditionPanel;

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
