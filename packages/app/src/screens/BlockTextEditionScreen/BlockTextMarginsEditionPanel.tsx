import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  BLOCK_TEXT_MAX_HORIZONTAL_MARGIN,
  BLOCK_TEXT_MAX_VERTICAL_MARGIN,
  BLOCK_TEXT_TEXT_MAX_HORIZONTAL_MARGIN,
  BLOCK_TEXT_TEXT_MAX_VERTICAL_MARGIN,
} from '@azzapp/shared/cardModuleHelpers';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';

import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native';

type BlockTextMarginsEditionPanelProps = ViewProps & {
  /**
   * The textMarginVertical currently set on the module
   */
  textMarginVertical: number;
  /**
   * A callback called when the user update the textMarginVertical
   */
  onTextMarginVerticalChange: (textMarginVertical: number) => void;
  /**
   * The textMarginHorizontal currently set on the module
   */
  textMarginHorizontal: number;
  /**
   * A callback called when the user update the textMarginHorizontal
   */
  onTextMarginHorizontalChange: (textMarginHorizontal: number) => void;
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
};

/**
 * A Panel to edit the Margins of the BlockText edition screen
 */
const BlockTextMarginsEditionPanel = ({
  textMarginVertical,
  onTextMarginVerticalChange,
  textMarginHorizontal,
  onTextMarginHorizontalChange,
  marginHorizontal,
  onMarginHorizontalChange,
  marginVertical,
  onMarginVerticalChange,
  style,
  ...props
}: BlockTextMarginsEditionPanelProps) => {
  const intl = useIntl();

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Margins',
          description: 'Title of the Margins section in BlockText edition',
        })}
      />
      <View style={styles.paramContainer}>
        <LabeledDashedSlider
          label={intl.formatMessage({
            defaultMessage: 'Text margin :',
            description: 'Text margin message in BlockText edition',
          })}
          initialValue={textMarginVertical}
          min={0}
          max={BLOCK_TEXT_TEXT_MAX_VERTICAL_MARGIN}
          step={1}
          onChange={onTextMarginVerticalChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Text top/bottom margin',
            description:
              'Label of the Text top/bottom margin slider in BlockText edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Text top/bottom margin',
            description:
              'Hint of the Text top/bottom margin slider in BlockText edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Text left/right margin :"
              description="textMarginHorizontal message in BlockText edition"
            />
          }
          initialValue={textMarginHorizontal}
          min={0}
          max={BLOCK_TEXT_TEXT_MAX_HORIZONTAL_MARGIN}
          step={1}
          onChange={onTextMarginHorizontalChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Text left/right margin',
            description:
              'Label of the Text left/right margin slider in BlockText edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Text left/right margin',
            description:
              'Hint of the Text left/right margin slider in BlockText edition',
          })}
          style={styles.slider}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            columnGap: 30,
          }}
        >
          <LabeledDashedSlider
            label={
              <FormattedMessage
                defaultMessage="Space top/bottom :"
                description="Space top/bottom message in BlockText edition"
              />
            }
            initialValue={marginVertical}
            min={0}
            max={BLOCK_TEXT_MAX_VERTICAL_MARGIN}
            step={1}
            onChange={onMarginVerticalChange}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Space top/bottom',
              description:
                'Label of the Space top/bottom slider in BlockText edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Slide to change the Space top/bottom',
              description:
                'Hint of the Space top/bottom slider in BlockText edition',
            })}
            style={styles.halfSlider}
          />
          <LabeledDashedSlider
            label={
              <FormattedMessage
                defaultMessage="Space left/right :"
                description="Space left/right message in BlockText edition"
              />
            }
            initialValue={marginHorizontal}
            min={0}
            max={BLOCK_TEXT_MAX_HORIZONTAL_MARGIN}
            step={1}
            onChange={onMarginHorizontalChange}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Space left/right',
              description:
                'Label of the Space left/right slider in BlockText edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Slide to change the Space left/right',
              description:
                'Hint of the Space left/right slider in BlockText edition',
            })}
            style={styles.halfSlider}
          />
        </View>
      </View>
    </View>
  );
};

export default BlockTextMarginsEditionPanel;

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
  halfSlider: {
    width: '40%',
    alignSelf: 'center',
  },
});
