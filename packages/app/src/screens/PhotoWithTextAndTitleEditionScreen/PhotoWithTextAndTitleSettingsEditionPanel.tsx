import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import {
  DEFAULT_COVER_MIN_FONT_SIZE,
  DEFAULT_COVER_MAX_FONT_SIZE,
} from '@azzapp/shared/coverHelpers';
import { ProfileColorDropDownPicker } from '#components/ProfileColorPicker';
import AlignmentButton from '#ui/AlignmentButton';
import FontDropDownPicker from '#ui/FontDropDownPicker';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { TextAlignment } from '@azzapp/relay/artifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { PhotoWithTextAndTitleSettingsEditionPanel_viewer$key } from '@azzapp/relay/artifacts/PhotoWithTextAndTitleSettingsEditionPanel_viewer.graphql';
import type { ViewProps } from 'react-native';

type PhotoWithTextAndTitleSettingsEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  viewer: PhotoWithTextAndTitleSettingsEditionPanel_viewer$key;
  /**
   * The fontFamily currently set on the module
   */
  fontFamily: string;
  /**
   * A callback called when the user update the fontFamily
   */
  onFontFamilyChange: (fontFamily: string) => void;
  /**
   * The fontColor currently set on the module
   */
  fontColor: string;
  /**
   * A callback called when the user update the fontColor
   */
  onFontColorChange: (fontColor: string) => void;
  /**
   * The textAlign currently set on the module
   */
  textAlign: TextAlignment;
  /**
   * A callback called when the user update the textAlign
   */
  onTextAlignChange: (textAlign: TextAlignment) => void;
  /**
   * The fontSize currently set on the module
   */
  fontSize: number;
  /**
   * A callback called when the user update the fontSize
   */
  onFontSizeChange: (fontSize: number) => void;
  /**
   * The textSize currently set on the module
   */
  textSize: number;
  /**
   * A callback called when the user update the textSize
   */
  onTextSizeChange: (textSize: number) => void;
  /**
   * The verticalSpacing currently set on the module
   */
  verticalSpacing: number;
  /**
   * A callback called when the user update the verticalSpacing
   */
  onVerticalSpacingChange: (verticalSpacing: number) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
};

/**
 * A Panel to edit the Settings of the PhotoWithTextAndTitle edition screen
 */
const PhotoWithTextAndTitleSettingsEditionPanel = ({
  viewer,
  fontFamily,
  onFontFamilyChange,
  fontColor,
  onFontColorChange,
  textAlign,
  onTextAlignChange,
  verticalSpacing,
  onVerticalSpacingChange,
  fontSize,
  onFontSizeChange,
  textSize,
  onTextSizeChange,
  style,
  bottomSheetHeight,
  ...props
}: PhotoWithTextAndTitleSettingsEditionPanelProps) => {
  const intl = useIntl();

  const { profile } = useFragment(
    graphql`
      fragment PhotoWithTextAndTitleSettingsEditionPanel_viewer on Viewer {
        profile {
          ...ProfileColorPicker_profile
        }
      }
    `,
    viewer,
  );

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Configuration',
          description: 'Title of the settings section in Line Divider edition',
        })}
      />
      <View style={styles.paramContainer}>
        <View style={styles.buttonContainer}>
          <FontDropDownPicker
            fontFamily={fontFamily}
            onFontFamilyChange={onFontFamilyChange}
            bottomSheetHeight={bottomSheetHeight}
          />
          <ProfileColorDropDownPicker
            profile={profile!}
            color={fontColor}
            onColorChange={onFontColorChange}
            bottomSheetHeight={bottomSheetHeight}
          />
          <AlignmentButton
            alignment={textAlign}
            onAlignmentChange={onTextAlignChange}
          />
        </View>
        <View style={styles.titletextContainer}>
          <LabeledDashedSlider
            label={
              <FormattedMessage
                defaultMessage="Title size : {size}"
                description="Title size message in PhotoWithTextAndTitle edition"
                values={{
                  size: fontSize,
                }}
              />
            }
            value={fontSize}
            min={DEFAULT_COVER_MIN_FONT_SIZE}
            max={DEFAULT_COVER_MAX_FONT_SIZE}
            step={1}
            onChange={onFontSizeChange}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Title size',
              description:
                'Label of the Title size slider in PhotoWithTextAndTitle edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Slide to change the Title size',
              description:
                'Hint of the Title size slider in PhotoWithTextAndTitle edition',
            })}
            style={styles.halfSlider}
          />
          <LabeledDashedSlider
            label={
              <FormattedMessage
                defaultMessage="Text size : {size}"
                description="textSize message in PhotoWithTextAndTitle edition"
                values={{
                  size: textSize,
                }}
              />
            }
            value={textSize}
            min={DEFAULT_COVER_MIN_FONT_SIZE}
            max={DEFAULT_COVER_MAX_FONT_SIZE}
            step={1}
            onChange={onTextSizeChange}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Text size',
              description:
                'Label of the textSize slider in PhotoWithTextAndTitle edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Slide to change the Text size',
              description:
                'Hint of the textSize slider in PhotoWithTextAndTitle edition',
            })}
            style={styles.halfSlider}
          />
        </View>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Vertical Spacing: {size}"
              description="Vertical Spacing message in PhotoWithTextAndTitle edition"
              values={{
                size: verticalSpacing,
              }}
            />
          }
          value={verticalSpacing}
          min={0}
          max={20}
          step={1}
          onChange={onVerticalSpacingChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Vertical Spacing',
            description:
              'Label of the Vertical Spacing slider in PhotoWithTextAndTitle edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change theVertical Spacing',
            description:
              'Hint of the Vertical Spacing slider in PhotoWithTextAndTitle edition',
          })}
          style={styles.slider}
        />
      </View>
    </View>
  );
};

export default PhotoWithTextAndTitleSettingsEditionPanel;

const styles = StyleSheet.create({
  titletextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 30,
  },
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
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: 15,
  },
});
