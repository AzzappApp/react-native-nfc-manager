import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { graphql, useFragment } from 'react-relay';
import EditorLayerSelectorPanel from '#components/EditorLayerSelectorPanel';
import type { CECBackgroundPanel_viewer$key } from '#relayArtifacts/CECBackgroundPanel_viewer.graphql';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { StyleProp, ViewStyle } from 'react-native';

type CECBackgroundPanelProps = {
  viewer: CECBackgroundPanel_viewer$key;
  background: string | null | undefined;
  backgroundColor: string | null | undefined;
  backgroundPatternColor: string | null | undefined;
  colorPalette: ColorPalette;
  otherColors: string[];
  bottomSheetHeights: number;
  style: StyleProp<ViewStyle>;
  onBackgroundChange: (background: string | null) => void;
  onBackgroundColorChange: (color: string) => void;
  onBackgroundPatternColorChange: (color: string) => void;
  /**
   * Called when the user update the color palette
   */
  onUpdateColorPalette: (colorPalette: ColorPalette) => void;
  /**
   * Called when the user update the color list
   */
  onUpdateColorList: (color: string[]) => void;
};

const CECBackgroundPanel = ({
  viewer,
  background,
  backgroundColor,
  backgroundPatternColor,
  colorPalette,
  otherColors,
  onBackgroundChange,
  onBackgroundColorChange,
  onBackgroundPatternColorChange,
  onUpdateColorPalette,
  onUpdateColorList,
  bottomSheetHeights,
  style,
}: CECBackgroundPanelProps) => {
  const { coverBackgrounds } = useFragment(
    graphql`
      fragment CECBackgroundPanel_viewer on Viewer {
        coverBackgrounds {
          ...StaticMediaList_staticMedias
        }
      }
    `,
    viewer,
  );

  backgroundColor = backgroundColor ?? '#FFFFFF';
  backgroundPatternColor = backgroundPatternColor ?? '#000000';

  const onColorChange = useCallback(
    (color: 'backgroundColor' | 'tintColor', value: string) => {
      if (color === 'backgroundColor') {
        onBackgroundColorChange(value);
      } else {
        onBackgroundPatternColorChange(value);
      }
    },
    [onBackgroundColorChange, onBackgroundPatternColorChange],
  );

  const intl = useIntl();
  return (
    <EditorLayerSelectorPanel
      testID="cover-background-panel"
      title={intl.formatMessage({
        defaultMessage: 'Background',
        description: 'Label of Background tab in cover edition',
      })}
      medias={coverBackgrounds}
      selectedMedia={background}
      tintColor={backgroundPatternColor}
      backgroundColor={backgroundColor}
      bottomSheetHeight={bottomSheetHeights}
      colorPalette={colorPalette}
      colorList={otherColors}
      canEditPalette
      onMediaChange={onBackgroundChange}
      onColorChange={onColorChange}
      onUpdateColorList={onUpdateColorList}
      onUpdateColorPalette={onUpdateColorPalette}
      style={style}
    />
  );
};

export default CECBackgroundPanel;
