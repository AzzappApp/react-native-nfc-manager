import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  HORIZONTAL_PHOTO_MAX_IMAGE_HEIGHT,
  HORIZONTAL_PHOTO_MIN_IMAGE_HEIGHT,
} from '@azzapp/shared/cardModuleHelpers';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type HorizontalPhotoSettingsEditionPanelProps = ViewProps & {
  /**
   * The height currently set on the module
   */
  height: SharedValue<number>;

  onTouched: () => void;
};

/**
 * Panel to edit the style of the HorizontalPhoto
 */
const HorizontalPhotoSettingsEditionPanel = ({
  height,
  style,
  onTouched,
  ...props
}: HorizontalPhotoSettingsEditionPanelProps) => {
  const intl = useIntl();

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Configuration',
          description:
            'Title of the settings section in HorizontalPhoto edition',
        })}
      />
      <View style={styles.paramContainer}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Height:"
              description="Height message in HorizontalPhoto edition"
            />
          }
          value={height}
          min={HORIZONTAL_PHOTO_MIN_IMAGE_HEIGHT}
          max={HORIZONTAL_PHOTO_MAX_IMAGE_HEIGHT}
          step={1}
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
          onTouched={onTouched}
        />
      </View>
    </View>
  );
};

export default HorizontalPhotoSettingsEditionPanel;

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
