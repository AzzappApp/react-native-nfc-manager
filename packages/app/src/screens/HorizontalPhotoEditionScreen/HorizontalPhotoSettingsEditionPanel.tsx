import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native';

type HorizontalPhotoSettingsEditionPanelProps = ViewProps & {
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
const HorizontalPhotoSettingsEditionPanel = ({
  height,
  onHeightChange,
  style,
  ...props
}: HorizontalPhotoSettingsEditionPanelProps) => {
  const intl = useIntl();
  const windowWidth = useWindowDimensions().width;
  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Settings',
          description:
            'Title of the settings section in HorizontalPhoto edition',
        })}
      />
      <View style={styles.paramContainer}>
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

export default HorizontalPhotoSettingsEditionPanel;

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
