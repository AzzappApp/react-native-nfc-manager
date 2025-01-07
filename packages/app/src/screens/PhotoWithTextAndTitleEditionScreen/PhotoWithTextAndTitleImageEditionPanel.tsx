import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  PHOTO_WITH_TEXT_AND_TITLE_MAX_ASPECT_RATIO,
  PHOTO_WITH_TEXT_AND_TITLE_MAX_BORDER_RADIUS,
  PHOTO_WITH_TEXT_AND_TITLE_MIN_ASPECT_RATIO,
} from '@azzapp/shared/cardModuleHelpers';
import FloatingIconButton from '#ui/FloatingIconButton';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type {
  CardModulePhotoWithTextAndTitleImageMargin,
  HorizontalArrangement,
  VerticalArrangement,
} from '#relayArtifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { Icons } from '#ui/Icon';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type PhotoWithTextAndTitleImageEditionPanelProps = ViewProps & {
  /**
   * The borderRadius currently set on the module
   */
  borderRadius: SharedValue<number>;
  /**
   * The imageMargin currently set on the module
   */
  imageMargin: CardModulePhotoWithTextAndTitleImageMargin;
  /**
   * A callback called when the user update the imageMargin
   */
  onImageMarginChange: () => void;
  /**
   * The vertical arrangement currently set on the module
   */
  verticalArrangement: Omit<VerticalArrangement, '%future added value'>;
  /**
   * A callback called when the user update the vertical arrangement
   */
  onVerticalArrangementChange: () => void;
  /**
   * The horizontal arrangement currently set on the module
   */
  horizontalArrangement: Omit<HorizontalArrangement, '%future added value'>;
  /**
   * A callback called when the user update the horizontal arrangement
   */
  onHorizontalArrangementChange: () => void;
  /**
   * The aspectRatio currently set on the module
   */
  aspectRatio: SharedValue<number>;

  onTouched: () => void;
};

/**
 * A Panel to edit the Settings of the PhotoWithTextAndTitle edition screen
 */
const PhotoWithTextAndTitleImageEditionPanel = ({
  borderRadius,
  imageMargin,
  onImageMarginChange,
  verticalArrangement,
  horizontalArrangement,
  onVerticalArrangementChange,
  onHorizontalArrangementChange,
  aspectRatio,
  style,
  onTouched,
  ...props
}: PhotoWithTextAndTitleImageEditionPanelProps) => {
  const intl = useIntl();

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Image',
          description: 'Title of the Image section in Line Divider edition',
        })}
      />
      <View style={styles.paramContainer}>
        <View style={styles.buttonContainer}>
          <FloatingIconButton
            onPress={onImageMarginChange}
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Text alignment',
              description: 'Label of the text alignment button',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Tap to change the text alignment of the text',
              description: 'Hint of the text alignment button',
            })}
            icon={imageMargin as Icons}
          />
          <FloatingIconButton
            onPress={onHorizontalArrangementChange}
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Horizontal alignment for web only',
              description: 'Label of the Horizontal alignment button',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage:
                'Tap to change the Horizontal alignment of the text',
              description: 'Hint of the Horizontal alignment button',
            })}
            icon={`image_${horizontalArrangement}` as Icons}
          />
          <FloatingIconButton
            onPress={onVerticalArrangementChange}
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Vertical alignment for mobile only',
              description: 'Label of the Vertical alignment button',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage:
                'Tap to change the Vertical alignment of the text',
              description: 'Hint of the Vertical alignment button',
            })}
            icon={`image_${verticalArrangement}` as Icons}
          />
        </View>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border radius :"
              description="borderRadius message in PhotoWithTextAndTitle edition"
            />
          }
          value={borderRadius}
          min={0}
          max={PHOTO_WITH_TEXT_AND_TITLE_MAX_BORDER_RADIUS}
          step={1}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border radius',
            description:
              'Label of the borderRadius slider in PhotoWithTextAndTitle edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the border radius',
            description:
              'Hint of the borderRadius slider in PhotoWithTextAndTitle edition',
          })}
          style={styles.slider}
          onTouched={onTouched}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Aspect ratio:"
              description="Aspect ratio message in PhotoWithTextAndTitle edition"
            />
          }
          value={aspectRatio}
          min={PHOTO_WITH_TEXT_AND_TITLE_MIN_ASPECT_RATIO}
          max={PHOTO_WITH_TEXT_AND_TITLE_MAX_ASPECT_RATIO}
          step={0.01}
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
          style={styles.slider}
          onTouched={onTouched}
        />
      </View>
    </View>
  );
};

export default PhotoWithTextAndTitleImageEditionPanel;

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
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: 15,
  },
});
