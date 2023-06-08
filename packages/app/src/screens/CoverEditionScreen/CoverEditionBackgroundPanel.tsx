import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { graphql, useFragment } from 'react-relay';
import EditorLayerSelectorPanel from '#components/EditorLayerSelectorPanel';
import type { CoverEditionBackgroundPanel_viewer$key } from '@azzapp/relay/artifacts/CoverEditionBackgroundPanel_viewer.graphql';
import type { CardCoverBackgroundStyleInput } from '@azzapp/relay/artifacts/CoverEditionScreenMutation.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type CoverEditionBackgroundPanelProps = {
  viewer: CoverEditionBackgroundPanel_viewer$key;
  background: string | null | undefined;
  backgroundStyle: CardCoverBackgroundStyleInput | null | undefined;
  onBackgroundChange: (background: string | null) => void;
  onBackgroundStyleChange: (style: CardCoverBackgroundStyleInput) => void;
  bottomSheetHeights: number;
  style: StyleProp<ViewStyle>;
};

const CoverEditionBackgroundPanel = ({
  viewer,
  background,
  backgroundStyle,
  onBackgroundChange,
  onBackgroundStyleChange,
  bottomSheetHeights,
  style,
}: CoverEditionBackgroundPanelProps) => {
  const { coverBackgrounds, profile } = useFragment(
    graphql`
      fragment CoverEditionBackgroundPanel_viewer on Viewer {
        coverBackgrounds {
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

  const onColorChange = useCallback(
    (color: 'backgroundColor' | 'tintColor', value: string) => {
      if (color === 'backgroundColor') {
        onBackgroundStyleChange({ backgroundColor: value, patternColor });
      } else {
        onBackgroundStyleChange({ backgroundColor, patternColor: value });
      }
    },
    [backgroundColor, onBackgroundStyleChange, patternColor],
  );

  const intl = useIntl();
  return (
    <EditorLayerSelectorPanel
      title={intl.formatMessage({
        defaultMessage: 'Background',
        description: 'Label of Background tab in cover edition',
      })}
      profile={profile!}
      medias={coverBackgrounds}
      selectedMedia={background}
      tintColor={patternColor}
      backgroundColor={backgroundColor}
      onMediaChange={onBackgroundChange}
      onColorChange={onColorChange}
      bottomSheetHeight={bottomSheetHeights}
      style={style}
      testID="cover-background-panel"
    />
  );
};

export default CoverEditionBackgroundPanel;
