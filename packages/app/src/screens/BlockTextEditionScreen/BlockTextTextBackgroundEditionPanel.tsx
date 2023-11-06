import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import { WebCardBoundEditorLayerSelectorPanel } from '#components/EditorLayerSelectorPanel';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import type { BlockTextTextBackgroundEditionPanel_viewer$key } from '@azzapp/relay/artifacts/BlockTextTextBackgroundEditionPanel_viewer.graphql';
import type { ViewProps } from 'react-native';

type BackgroundStyle = {
  backgroundColor: string;
  patternColor: string;
};

type TextBackgroundStyle = BackgroundStyle & {
  opacity: number;
};

type BlockTextTextBackgroundEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  viewer: BlockTextTextBackgroundEditionPanel_viewer$key;
  /**
   * The currently selected textBackground id
   */
  textBackgroundId: string | null | undefined;
  /**
   * The currently selected textBackground style
   */
  textBackgroundStyle: TextBackgroundStyle | null | undefined;
  /**
   * A callback called when the user select a new textBackground
   * @param textBackgroundId The new textBackground id, or null if the user select the "none" option
   */
  onTextBackgroundChange: (textBackgroundId: string | null) => void;
  /**
   * A callback called when the user update the textBackground style
   */
  onTextBackgroundStyleChange: (style: TextBackgroundStyle) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
};

/**
 * A Panel to edit the TextTextBackground of the BlockText edition screen
 */
const BlockTextTextBackgroundEditionPanel = ({
  viewer,
  textBackgroundId: textBackground,
  textBackgroundStyle,
  onTextBackgroundChange,
  onTextBackgroundStyleChange,
  bottomSheetHeight,
  ...props
}: BlockTextTextBackgroundEditionPanelProps) => {
  const { moduleBackgrounds, profile } = useFragment(
    graphql`
      fragment BlockTextTextBackgroundEditionPanel_viewer on Viewer {
        moduleBackgrounds {
          ...StaticMediaList_staticMedias
        }
        profile {
          webCard {
            ...WebCardColorPicker_webCard
          }
        }
      }
    `,
    viewer,
  );

  const textBackgroundColor = textBackgroundStyle?.backgroundColor ?? '#FFFFFF';
  const patternColor = textBackgroundStyle?.patternColor ?? '#000000';
  const opacity = textBackgroundStyle?.opacity ?? 100;

  const onColorChange = useCallback(
    (color: 'backgroundColor' | 'tintColor', value: string) => {
      if (color === 'backgroundColor') {
        onTextBackgroundStyleChange({
          backgroundColor: value,
          patternColor,
          opacity,
        });
      } else {
        onTextBackgroundStyleChange({
          backgroundColor: textBackgroundColor,
          patternColor: value,
          opacity,
        });
      }
    },
    [onTextBackgroundStyleChange, opacity, patternColor, textBackgroundColor],
  );

  const onOpacityChange = useCallback(
    (value: number) => {
      onTextBackgroundStyleChange({
        backgroundColor: textBackgroundColor,
        patternColor,
        opacity: value,
      });
    },
    [onTextBackgroundStyleChange, patternColor, textBackgroundColor],
  );
  const intl = useIntl();

  return (
    <View {...props}>
      <WebCardBoundEditorLayerSelectorPanel
        title={intl.formatMessage({
          defaultMessage: 'TextBackground',
          description:
            'Label of TextBackground tab in Horizontal photo edition',
        })}
        webCard={profile?.webCard ?? null}
        medias={moduleBackgrounds}
        selectedMedia={textBackground}
        tintColor={patternColor}
        backgroundColor={textBackgroundColor}
        onMediaChange={onTextBackgroundChange}
        onColorChange={onColorChange}
        bottomSheetHeight={bottomSheetHeight}
        svgMode
        imageRatio={1}
        style={styles.mediaSelector}
      />

      <LabeledDashedSlider
        label={
          <FormattedMessage
            defaultMessage="Photo opacity :"
            description="Photo Opacity message in BlockText edition"
          />
        }
        initialValue={opacity}
        min={0}
        max={100}
        step={1}
        onChange={onOpacityChange}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'TextBackground opacity',
          description: 'Label of the Photo Opacityslider in BlockText edition',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Slide to change the textBackground opacity',
          description: 'Hint of the Photo Opacityslider in BlockText edition',
        })}
        style={styles.slider}
      />
    </View>
  );
};

export default BlockTextTextBackgroundEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  mediaSelector: {
    flex: 1,
    marginBottom: 20,
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
