import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { graphql, useFragment } from 'react-relay';
import EditorLayerSelectorPanel from '#components/EditorLayerSelectorPanel';
import type { CECForegroundPanel_profile$key } from '#relayArtifacts/CECForegroundPanel_profile.graphql';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { StyleProp, ViewStyle } from 'react-native';

type CECForegroundPanelProps = {
  profile: CECForegroundPanel_profile$key;
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
  profile,
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
      fragment CECForegroundPanel_profile on Profile {
        coverForegrounds {
          ...StaticMediaList_staticMedias
        }
      }
    `,
    profile,
  );

  const color = foregroundColor ?? '#000000';

  const onColorChange = useCallback(
    (_: unknown, value: string) => {
      onForegroundColorChange(value);
    },
    [onForegroundColorChange],
  );

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
