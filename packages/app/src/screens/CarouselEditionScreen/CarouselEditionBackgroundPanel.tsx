import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import EditorLayerSelectorPanel from '#components/EditorLayerSelectorPanel';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import type { CarouselEditionBackgroundPanel_viewer$key } from '@azzapp/relay/artifacts/CarouselEditionBackgroundPanel_viewer.graphql';
import type { ViewProps } from 'react-native';

type BackgroundStyle = {
  backgroundColor: string;
  patternColor: string;
  opacity: number;
};

export type CarouselBackgroundPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  viewer: CarouselEditionBackgroundPanel_viewer$key;
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
 * The background panel of the carousel edition screen
 */
const CarouselEditionBackgroundPanel = ({
  viewer,
  backgroundId: background,
  backgroundStyle,
  onBackgroundChange,
  onBackgroundStyleChange,
  bottomSheetHeight,
  ...props
}: CarouselBackgroundPanelProps) => {
  const { moduleBackgrounds, profile } = useFragment(
    graphql`
      fragment CarouselEditionBackgroundPanel_viewer on Viewer {
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
          description: 'Label of Background tab in carousel edition',
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
      <LabeledDashedSlider
        label={
          <FormattedMessage
            defaultMessage="Photo opacity : {opacity}"
            description="Font size message in cover edition"
            values={{ opacity }}
          />
        }
        value={opacity}
        min={0}
        max={100}
        step={5}
        onChange={onOpacityChange}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Background opacity',
          description:
            'Label of the Background opacity slider in carousel edition',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Slide to change the background opacity',
          description:
            'Hint of the Background opacity slider in carousel edition',
        })}
        style={styles.slider}
      />
    </View>
  );
};

export default CarouselEditionBackgroundPanel;

const styles = StyleSheet.create({
  mediaSelector: {
    flex: 1,
    marginBottom: 20,
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
