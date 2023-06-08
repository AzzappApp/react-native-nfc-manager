import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { graphql, useFragment } from 'react-relay';
import EditorLayerSelectorPanel from '#components/EditorLayerSelectorPanel';
import type { CoverEditionForegroundPanel_viewer$key } from '@azzapp/relay/artifacts/CoverEditionForegroundPanel_viewer.graphql';
import type { CardCoverForegroundStyleInput } from '@azzapp/relay/artifacts/CoverEditionScreenMutation.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type CoverEditionForegroundPanelProps = {
  viewer: CoverEditionForegroundPanel_viewer$key;
  foreground: string | null | undefined;
  foregroundStyle: CardCoverForegroundStyleInput | null | undefined;
  onForegroundChange: (foregroundId: string | null) => void;
  onForegroundStyleChange: (style: CardCoverForegroundStyleInput) => void;
  bottomSheetHeights: number;
  style: StyleProp<ViewStyle>;
};

const CoverEditionForegroundPanel = ({
  viewer,
  foreground,
  foregroundStyle,
  onForegroundChange,
  onForegroundStyleChange,
  bottomSheetHeights,
  style,
}: CoverEditionForegroundPanelProps) => {
  const { coverForegrounds, profile } = useFragment(
    graphql`
      fragment CoverEditionForegroundPanel_viewer on Viewer {
        coverForegrounds {
          ...StaticMediaList_staticMedias
        }
        profile {
          ...ProfileColorPicker_profile
        }
      }
    `,
    viewer,
  );

  const color = foregroundStyle?.color ?? '#000000';
  const onColorChange = useCallback(
    (_: any, color: string) => {
      onForegroundStyleChange({ color });
    },
    [onForegroundStyleChange],
  );

  const intl = useIntl();
  return (
    <EditorLayerSelectorPanel
      title={intl.formatMessage({
        defaultMessage: 'Foreground',
        description: 'Label of Foreground tab in cover edition',
      })}
      profile={profile!}
      medias={coverForegrounds}
      selectedMedia={foreground}
      tintColor={color}
      onMediaChange={onForegroundChange}
      onColorChange={onColorChange}
      bottomSheetHeight={bottomSheetHeights}
      style={style}
      testID="cover-foreground-panel"
    />
  );
};

export default CoverEditionForegroundPanel;
