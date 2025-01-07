import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  SOCIAL_LINKS_MAX_MARGIN_BOTTOM,
  SOCIAL_LINKS_MAX_MARGIN_HORIZONTAL,
  SOCIAL_LINKS_MAX_MARGIN_TOP,
} from '@azzapp/shared/cardModuleHelpers';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';

import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type SocialLinksMarginsEditionPanelProps = ViewProps & {
  /**
   * The marginTop currently set on the module
   */
  marginTop: SharedValue<number>;
  /**
   * The marginBottom currently set on the module
   */
  marginBottom: SharedValue<number>;
  /**
   * The marginHorizontal currently set on the module
   */
  marginHorizontal: SharedValue<number>;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;

  onTouched: () => void;
};

/**
 * A Panel to edit the Margins of the SocialLinks edition screen
 */
const SocialLinksMarginsEditionPanel = ({
  marginTop,
  marginBottom,
  marginHorizontal,
  style,
  onTouched,
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
              defaultMessage="Top margin :"
              description="Top margin message in SocialLinks edition"
            />
          }
          value={marginTop}
          min={0}
          max={SOCIAL_LINKS_MAX_MARGIN_TOP}
          step={1}
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
          onTouched={onTouched}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Bottom margin :"
              description="Bottom margin message in SocialLinks edition"
            />
          }
          value={marginBottom}
          min={0}
          max={SOCIAL_LINKS_MAX_MARGIN_BOTTOM}
          step={1}
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
          onTouched={onTouched}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Horizontal margin :"
              description="Horizontal margin message in SocialLinks edition"
            />
          }
          value={marginHorizontal}
          min={0}
          max={SOCIAL_LINKS_MAX_MARGIN_HORIZONTAL}
          step={1}
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
          onTouched={onTouched}
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
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
