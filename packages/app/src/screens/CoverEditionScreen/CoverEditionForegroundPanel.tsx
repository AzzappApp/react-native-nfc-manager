import { useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import ProfileColorPalette from '#components/ProfileColorPalette';
import TabsBar from '#ui/TabsBar';
import ColorPreview from './ColorPreview';
import CoverLayerList from './CoverLayerList';
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
          ...CoverLayerList_layers
        }
        profile {
          ...ProfileColorPalette_profile
        }
      }
    `,
    viewer,
  );

  const [currentTab, setCurrentTab] = useState('foreground');

  const color = foregroundStyle?.color ?? '#000000';
  const onColorChange = (color: string) => {
    onForegroundStyleChange({ color });
  };

  const intl = useIntl();
  return (
    <View style={style}>
      <TabsBar
        currentTab="foreground"
        onTabPress={setCurrentTab}
        decoration="underline"
        tabs={[
          {
            tabKey: 'foreground',
            label: intl.formatMessage({
              defaultMessage: 'Foreground',
              description: 'Label of Foreground tab in cover edition',
            }),
          },
          {
            tabKey: 'color',
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
      <CoverLayerList
        layers={coverForegrounds}
        selectedLayer={foreground}
        tintColor={color}
        onSelectLayer={onForegroundChange}
        backgroundColor="#ffffff"
        style={styles.content}
      />
      {profile && (
        <ProfileColorPalette
          profile={profile}
          visible={currentTab === 'color'}
          selectedColor={color}
          onChangeColor={onColorChange}
          onRequestClose={() => setCurrentTab('foreground')}
          height={bottomSheetHeights}
          title={intl.formatMessage({
            defaultMessage: 'Foreground color',
            description: 'Title of the foreground color picker',
          })}
        />
      )}
    </View>
  );
};

export default CoverEditionForegroundPanel;

const styles = StyleSheet.create({
  content: {
    margin: 15,
  },
});
