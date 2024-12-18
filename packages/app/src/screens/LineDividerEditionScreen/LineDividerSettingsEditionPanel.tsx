import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  LINE_DIVIDER_MAX_HEIGHT,
  LINE_DIVIDER_MIN_HEIGHT,
} from '@azzapp/shared/cardModuleHelpers';
import FloatingIconButton from '#ui/FloatingIconButton';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { LineDividerOrientation } from '#relayArtifacts/LineDividerEditionScreen_module.graphql';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type LineDividerSettingsEditionPanelProps = ViewProps & {
  /**
   * The height of divider
   */
  height: SharedValue<number>;
  /**
   * orientation of the divider
   *
   * @type {LineDividerOrientation}
   */
  orientation: LineDividerOrientation;
  /**
   *
   *
   */
  onOrientationChange: () => void;

  onTouched: () => void;
};

/**
 * Panel to edit the style of the Line Divider
 */
const LineDividerSettingsEditionPanel = ({
  height,
  orientation,
  onOrientationChange,
  style,
  onTouched,
  ...props
}: LineDividerSettingsEditionPanelProps) => {
  const intl = useIntl();
  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Configuration',
          description:
            'Title of the configuration section in line divider edition',
        })}
      />
      <View style={styles.buttonContainer}>
        <FloatingIconButton
          icon={
            orientation === 'bottomRight' ? 'sharpness' : 'sharpness_mirror'
          }
          iconSize={24}
          onPress={onOrientationChange}
        />
      </View>
      <LabeledDashedSlider
        label={
          <FormattedMessage
            defaultMessage="Height :"
            description="Height message in Line Divider edition"
          />
        }
        value={height}
        min={LINE_DIVIDER_MIN_HEIGHT}
        max={LINE_DIVIDER_MAX_HEIGHT}
        step={1}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Height',
          description: 'Label of the height slider in Line Divider edition',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Slide to change the height',
          description: 'Hint of the height slider in Line Divider edition',
        })}
        style={styles.slider}
        onTouched={onTouched}
      />
    </View>
  );
};

export default LineDividerSettingsEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingVertical: 15,
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
