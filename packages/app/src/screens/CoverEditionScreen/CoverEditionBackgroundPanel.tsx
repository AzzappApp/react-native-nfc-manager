import { useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import ProfileColorPalette from '#components/ProfileColorPalette';
import TabsBar from '#ui/TabsBar';
import ColorPreview from './ColorPreview';
import CoverLayerList from './CoverLayerlist';
import type { CoverEditionBackgroundPanel_viewer$key } from '@azzapp/relay/artifacts/CoverEditionBackgroundPanel_viewer.graphql';
import type { CardCoverBackgroundStyleInput } from '@azzapp/relay/artifacts/CoverEditionScreenMutation.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type CoverEditionBackgroundPanelProps = {
  viewer: CoverEditionBackgroundPanel_viewer$key;
  background: string | null | undefined;
  backgroundStyle: CardCoverBackgroundStyleInput | null | undefined;
  onBackgroundChange: (background: string | null) => void;
  onBackgroundStyleChange: (style: CardCoverBackgroundStyleInput) => void;
  style: StyleProp<ViewStyle>;
};

const CoverEditionBackgroundPanel = ({
  viewer,
  background,
  backgroundStyle,
  onBackgroundChange,
  onBackgroundStyleChange,
  style,
}: CoverEditionBackgroundPanelProps) => {
  const { coverBackgrounds } = useFragment(
    graphql`
      fragment CoverEditionBackgroundPanel_viewer on Viewer {
        coverBackgrounds {
          ...CoverLayerlist_layers
        }
      }
    `,
    viewer,
  );

  const backgroundColor = backgroundStyle?.backgroundColor ?? '#FFFFFF';
  const patternColor = backgroundStyle?.patternColor ?? '#000000';
  const [currentTab, setCurrentTab] = useState('background');

  const onColorChange = (color: string) => {
    if (currentTab === 'backgroundColor') {
      onBackgroundStyleChange({ backgroundColor: color, patternColor });
    } else {
      onBackgroundStyleChange({ backgroundColor, patternColor: color });
    }
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
            key: 'background',
            label: intl.formatMessage({
              defaultMessage: 'Background',
              description: 'Label of Background tab in cover edition',
            }),
          },
          {
            key: 'patternColor',
            label: intl.formatMessage({
              defaultMessage: 'Color #1',
              description:
                'Label of the background pattern color tab in cover edition',
            }),
            rightElement: (
              <ColorPreview color={patternColor} style={{ marginLeft: 5 }} />
            ),
          },
          {
            key: 'backgroundColor',
            label: intl.formatMessage({
              defaultMessage: 'Color #2',
              description: 'Label of the background color tab in cover edition',
            }),
            rightElement: (
              <ColorPreview color={backgroundColor} style={{ marginLeft: 5 }} />
            ),
          },
        ]}
      />
      {currentTab === 'background' ? (
        <CoverLayerList
          layers={coverBackgrounds}
          selectedLayer={background}
          backgroundColor={backgroundColor}
          tintColor={patternColor}
          onSelectLayer={onBackgroundChange}
          style={styles.content}
        />
      ) : (
        <ProfileColorPalette
          selectedColor={
            currentTab === 'backgroundColor' ? backgroundColor : patternColor
          }
          onChangeColor={onColorChange}
          style={styles.content}
        />
      )}
    </View>
  );
};

export default CoverEditionBackgroundPanel;

const styles = StyleSheet.create({
  root: {
    paddingTop: 10,
  },
  content: {
    margin: 15,
  },
});
