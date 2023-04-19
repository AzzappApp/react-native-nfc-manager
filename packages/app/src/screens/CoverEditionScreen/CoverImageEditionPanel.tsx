import { useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/cardHelpers';
import FilterSelectionList from '#components/FilterSelectionList';
import ImageEditionParametersList from '#components/ImageEditionParametersList';
import TabsBar from '#ui/TabsBar';
import type { EditableImageSource } from '#components/medias';
import type { ImageEditionParameters } from '#helpers/mediaHelpers';
import type { StyleProp, ViewStyle } from 'react-native';

type CoverImageEditionPanelProps = {
  media: EditableImageSource | null;
  filter: string | null;
  editionParameters: ImageEditionParameters;
  merged: boolean;
  backgroundImageColor?: string | null;
  backgroundImageTintColor?: string | null;
  foregroundImageTintColor?: string | null;
  onFilterChange(filter: string): void;
  onStartParameterEdition(parameter: string): void;
  style?: StyleProp<ViewStyle>;
};

const CoverImageEditionPanel = ({
  media,
  filter,
  editionParameters,
  merged,
  backgroundImageColor,
  backgroundImageTintColor,
  foregroundImageTintColor,
  onFilterChange,
  onStartParameterEdition,
  style,
}: CoverImageEditionPanelProps) => {
  const [currentTab, setCurrentTab] = useState<'edit' | 'filter'>('filter');

  const onTabPress = (tab: string) => {
    setCurrentTab(tab as 'edit' | 'filter');
  };

  const intl = useIntl();

  if (!media) {
    return null;
  }

  return (
    <View style={style}>
      <TabsBar
        currentTab={currentTab}
        onTabPress={onTabPress}
        decoration="underline"
        tabs={[
          {
            tabKey: 'filter',
            label: intl.formatMessage({
              defaultMessage: 'Effect',
              description: 'Label of the effect tab in cover edition',
            }),
          },
          {
            tabKey: 'edit',
            label: intl.formatMessage({
              defaultMessage: 'Adjust',
              description: 'Label of the adjust tab in cover edition',
            }),
          },
        ]}
      />
      <View style={styles.body}>
        {currentTab === 'filter' && (
          <FilterSelectionList
            media={media}
            editionParameters={editionParameters}
            backgroundImageColor={backgroundImageColor}
            backgroundImageTintColor={backgroundImageTintColor}
            foregroundImageTintColor={foregroundImageTintColor}
            backgroundMultiply={merged}
            aspectRatio={COVER_RATIO}
            selectedFilter={filter}
            onChange={onFilterChange}
            style={styles.filterSelectionList}
            contentContainerStyle={styles.filterSelectionListContentContainer}
            cardRadius={COVER_CARD_RADIUS}
          />
        )}
        {currentTab === 'edit' && (
          <ImageEditionParametersList
            style={{ flexGrow: 0 }}
            onSelectParam={onStartParameterEdition}
            excludedParams={['cropData']}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

export default CoverImageEditionPanel;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 10,
  },
  filterSelectionListContentContainer: { paddingHorizontal: 20 },
  filterSelectionList: {
    flex: 1,
    maxHeight: 300,
    marginTop: 20,
  },
});
