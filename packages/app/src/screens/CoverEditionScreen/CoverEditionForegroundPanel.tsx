import { useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { ColorChooser } from '#ui/ColorPicker';
import TabsBar from '#ui/TabsBar';
import ColorPreview from './ColorPreview';
import CoverLayerList from './CoverLayerlist';
import type { CoverEditionForegroundPanel_viewer$key } from '@azzapp/relay/artifacts/CoverEditionForegroundPanel_viewer.graphql';
import type { CardCoverForegroundStyleInput } from '@azzapp/relay/artifacts/CoverEditionScreenMutation.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type CoverEditionForegroundPanelProps = {
  viewer: CoverEditionForegroundPanel_viewer$key;
  foreground: string | null | undefined;
  foregroundStyle: CardCoverForegroundStyleInput | null | undefined;
  onForegroundChange: (foregroundId: string | null) => void;
  onForegroundStyleChange: (style: CardCoverForegroundStyleInput) => void;
  style: StyleProp<ViewStyle>;
};

const CoverEditionForegroundPanel = ({
  viewer,
  foreground,
  foregroundStyle,
  onForegroundChange,
  onForegroundStyleChange,
  style,
}: CoverEditionForegroundPanelProps) => {
  const { coverForegrounds } = useFragment(
    graphql`
      fragment CoverEditionForegroundPanel_viewer on Viewer {
        coverForegrounds {
          ...CoverLayerlist_layers
        }
      }
    `,
    viewer,
  );

  const color = foregroundStyle?.color ?? '#000000';
  const [currentTab, setCurrentTab] = useState('foreground');

  const onColorChange = (color: string) => {
    onForegroundStyleChange({ color });
  };

  const intl = useIntl();
  return (
    <View style={[styles.root, style]}>
      <TabsBar
        currentTab={currentTab}
        onTabPress={setCurrentTab}
        variant="topbar"
        tabs={[
          {
            key: 'foreground',
            label: intl.formatMessage({
              defaultMessage: 'Foreground',
              description: 'Label of Foreground tab in cover edition',
            }),
          },
          {
            key: 'color',
            rightElement: (
              <ColorPreview color={color} style={{ marginLeft: 5 }} />
            ),
            label: intl.formatMessage({
              defaultMessage: 'Color',
              description: 'Label of the foreground color tab in cover edition',
            }),
          },
        ]}
      />
      {currentTab === 'foreground' ? (
        <CoverLayerList
          layers={coverForegrounds}
          selectedLayer={foreground}
          tintColor={color}
          onSelectLayer={onForegroundChange}
          style={styles.content}
        />
      ) : (
        <ColorChooser
          value={color}
          onChange={onColorChange}
          style={styles.content}
        />
      )}
    </View>
  );
};

export default CoverEditionForegroundPanel;

const styles = StyleSheet.create({
  root: {
    paddingTop: 10,
  },
  content: {
    margin: 15,
  },
});
