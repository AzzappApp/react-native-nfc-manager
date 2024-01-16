import { useIntl } from 'react-intl';
import { graphql, useFragment } from 'react-relay';
import EditorLayerSelectorPanel from '#components/EditorLayerSelectorPanel';
import type { CECForegroundPanel_viewer$key } from '#relayArtifacts/CECForegroundPanel_viewer.graphql';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { StyleProp, ViewStyle } from 'react-native';

type CECForegroundPanelProps = {
  viewer: CECForegroundPanel_viewer$key;
  foreground: string | null | undefined;
  foregroundColor: string | null | undefined;
  colorPalette: ColorPalette;
  otherColors: string[];
  bottomSheetHeights: number;
  style: StyleProp<ViewStyle>;
  onForegroundChange: (foregroundId: string | null) => void;
  onForegroundColorChange: (color: string) => void;
  /**
   * Called when the user update the color palette
   */
  onUpdateColorPalette: (colorPalette: ColorPalette) => void;
  /**
   * Called when the user update the color list
   */
  onUpdateColorList: (color: string[]) => void;
};

const CECForegroundPanel = ({
  viewer,
  foreground,
  foregroundColor,
  colorPalette,
  otherColors,
  onForegroundChange,
  onForegroundColorChange,
  onUpdateColorPalette,
  onUpdateColorList,
  bottomSheetHeights,
  style,
}: CECForegroundPanelProps) => {
  const { coverForegrounds } = useFragment(
    graphql`
      fragment CECForegroundPanel_viewer on Viewer {
        coverForegrounds {
          ...StaticMediaList_staticMedias
        }
      }
    `,
    viewer,
  );

  const color = foregroundColor ?? '#000000';

  const onColorChange = (_: unknown, value: string) => {
    onForegroundColorChange(value);
  };

  const intl = useIntl();
  return (
    <EditorLayerSelectorPanel
      title={intl.formatMessage({
        defaultMessage: 'Foreground',
        description: 'Label of Foreground tab in cover edition',
      })}
      medias={coverForegrounds}
      selectedMedia={foreground}
      tintColor={color}
      colorPalette={colorPalette}
      colorList={otherColors}
      canEditPalette
      onMediaChange={onForegroundChange}
      onColorChange={onColorChange}
      onUpdateColorList={onUpdateColorList}
      onUpdateColorPalette={onUpdateColorPalette}
      bottomSheetHeight={bottomSheetHeights}
      style={style}
      testID="cover-foreground-panel"
    />
  );
};

export default CECForegroundPanel;
