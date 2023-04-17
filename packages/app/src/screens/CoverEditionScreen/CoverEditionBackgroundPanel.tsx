import { useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import ProfileColorPalette from '#components/ProfileColorPalette';
import TabsBar from '#ui/TabsBar';
import ColorPreview from './ColorPreview';
import CoverLayerList from './CoverLayerList';
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
          ...CoverLayerList_layers
        }
        profile {
          ...ProfileColorPalette_profile
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
  const patternColorLabel = intl.formatMessage({
    defaultMessage: 'Color #1',
    description: 'Label of the background pattern color tab in cover edition',
  });
  const backgroundColorLabel = intl.formatMessage({
    defaultMessage: 'Color #2',
    description: 'Label of the background color tab in cover edition',
  });
  return (
    <View style={style}>
      <TabsBar
        currentTab={currentTab}
        onTabPress={setCurrentTab}
        tabs={[
          {
            tabKey: 'background',
            label: intl.formatMessage({
              defaultMessage: 'Background',
              description: 'Label of Background tab in cover edition',
            }),
          },
          {
            tabKey: 'patternColor',
            label: patternColorLabel,
            rightElement: (
              <ColorPreview color={patternColor} style={{ marginLeft: 5 }} />
            ),
          },
          {
            tabKey: 'backgroundColor',
            label: backgroundColorLabel,
            rightElement: (
              <ColorPreview color={backgroundColor} style={{ marginLeft: 5 }} />
            ),
          },
        ]}
      />
      <CoverLayerList
        layers={coverBackgrounds}
        selectedLayer={background}
        backgroundColor={backgroundColor}
        tintColor={patternColor}
        onSelectLayer={onBackgroundChange}
        style={styles.content}
      />
      {profile && (
        <ProfileColorPalette
          visible={currentTab !== 'background'}
          height={bottomSheetHeights}
          profile={profile}
          title={
            currentTab === 'backgroundColor'
              ? backgroundColorLabel
              : patternColorLabel
          }
          selectedColor={
            currentTab === 'backgroundColor' ? backgroundColor : patternColor
          }
          onChangeColor={onColorChange}
          onRequestClose={() => setCurrentTab('background')}
        />
      )}
    </View>
  );
};

export default CoverEditionBackgroundPanel;

const styles = StyleSheet.create({
  content: {
    margin: 15,
  },
});
