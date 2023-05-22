import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import EditorLayerSelectorPanel from '#components/EditorLayerSelectorPanel';
import DashedSlider from '#ui/DashedSlider';
import Text from '#ui/Text';
import type { SimpleTextEditionBackgroundPanel_viewer$key } from '@azzapp/relay/artifacts/SimpleTextEditionBackgroundPanel_viewer.graphql';
import type { ViewProps } from 'react-native';

type BackgroundStyle = {
  backgroundColor: string;
  patternColor: string;
  opacity: number;
};

export type SimpleTextBackgroundPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  viewer: SimpleTextEditionBackgroundPanel_viewer$key;
  /**
   * The currently selected background id
   */
  backgroundId: string | null | undefined;
  /**
   * The currently selected background style
   */
  backgroundStyle: BackgroundStyle | null | undefined;
  /**
   * A callback called when the user select a new background
   * @param backgroundId The new background id, or null if the user select the "none" option
   */
  onBackgroundChange: (backgroundId: string | null) => void;
  /**
   * A callback called when the user update the background style
   */
  onBackgroundStyleChange: (style: BackgroundStyle) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
};

/**
 * The background panel of the simple text edition screen
 */
const SimpleTextEditionBackgroundPanel = ({
  viewer,
  backgroundId: background,
  backgroundStyle,
  onBackgroundChange,
  onBackgroundStyleChange,
  bottomSheetHeight,
  ...props
}: SimpleTextBackgroundPanelProps) => {
  const { moduleBackgrounds, profile } = useFragment(
    graphql`
      fragment SimpleTextEditionBackgroundPanel_viewer on Viewer {
        moduleBackgrounds {
          ...StaticMediaList_staticMedias
        }
        profile {
          ...ProfileColorPicker_profile
        }
      }
    `,
    viewer,
  );

  const backgroundColor = backgroundStyle?.backgroundColor ?? '#FFFFFF';
  const patternColor = backgroundStyle?.patternColor ?? '#000000';
  const opacity = backgroundStyle?.opacity ?? 100;

  const onColorChange = useCallback(
    (color: 'backgroundColor' | 'tintColor', value: string) => {
      if (color === 'backgroundColor') {
        onBackgroundStyleChange({
          backgroundColor: value,
          patternColor,
          opacity,
        });
      } else {
        onBackgroundStyleChange({
          backgroundColor,
          patternColor: value,
          opacity,
        });
      }
    },
    [backgroundColor, onBackgroundStyleChange, opacity, patternColor],
  );

  const onOpacityChange = useCallback(
    (value: number) => {
      onBackgroundStyleChange({
        backgroundColor,
        patternColor,
        opacity: value,
      });
    },
    [backgroundColor, onBackgroundStyleChange, patternColor],
  );

  const intl = useIntl();
  const { width: windowWidth } = useWindowDimensions();

  return (
    <View {...props}>
      <EditorLayerSelectorPanel
        title={intl.formatMessage({
          defaultMessage: 'Background',
          description: 'Label of Background tab in simple text edition',
        })}
        profile={profile!}
        medias={moduleBackgrounds}
        selectedMedia={background}
        tintColor={patternColor}
        backgroundColor={backgroundColor}
        onMediaChange={onBackgroundChange}
        onColorChange={onColorChange}
        bottomSheetHeight={bottomSheetHeight}
        svgMode
        imageRatio={1}
        style={styles.mediaSelector}
      />
      <View style={styles.sliderContainer}>
        <Text variant="small" style={[styles.sliderTitle]}>
          <FormattedMessage
            defaultMessage="Photo opacity : {opacity}"
            description="Font size message in cover edition"
            values={{ opacity }}
          />
        </Text>
        <DashedSlider
          value={opacity}
          min={0}
          max={100}
          step={5}
          interval={Math.floor((windowWidth - 80) / 60)}
          onChange={onOpacityChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Background opacity',
            description:
              'Label of the Background opacity slider in simple text edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the background opacity',
            description:
              'Hint of the Background opacity slider in simple text edition',
          })}
          style={{ width: '90%' }}
        />
      </View>
    </View>
  );
};

export default SimpleTextEditionBackgroundPanel;

const styles = StyleSheet.create({
  mediaSelector: {
    flex: 1,
    marginBottom: 20,
  },
  sliderContainer: {
    overflow: 'hidden',
    marginBottom: 20,
    rowGap: 10,
  },
  sliderTitle: {
    marginTop: 4,
    alignSelf: 'center',
  },
});
