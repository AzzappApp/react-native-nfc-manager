import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, View, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import Skeleton from '#components/Skeleton';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import type { CoverTemplateTagSelector_tags$key } from '#relayArtifacts/CoverTemplateTagSelector_tags.graphql';

type Props = {
  tags: CoverTemplateTagSelector_tags$key;
  onSelect: (tagId: string | null) => void;
  selected: string | null;
};

const CoverTemplateTagSelector = (props: Props) => {
  const { tags: tagsKey, onSelect, selected } = props;

  const intl = useIntl();

  const tags = useFragment(
    graphql`
      fragment CoverTemplateTagSelector_tags on CoverTemplateTag
      @relay(plural: true) {
        id
        label
      }
    `,
    tagsKey,
  );

  const clearSelected = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainerScrollView}
      >
        <RoundedMenuComponent
          selected={selected == null}
          id={null}
          label={intl.formatMessage({
            defaultMessage: 'All',
            description: 'CoverTemplateTagSelector - All',
          })}
          onSelect={clearSelected}
        />
        {tags?.map(({ id, label }) => (
          <RoundedMenuComponent
            key={`covertemplatetagselector_${id}`}
            id={id}
            selected={selected === id}
            label={label!}
            onSelect={onSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export const CoverTemplateTagSelectorFallback = () => {
  return (
    <View
      style={[
        styles.container,
        styles.containerFallback,
        styles.contentContainerScrollView,
      ]}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} style={styles.skeltonTag} />
      ))}
    </View>
  );
};

export default CoverTemplateTagSelector;

const styles = StyleSheet.create({
  contentContainerScrollView: {
    paddingHorizontal: 20,
    gap: 10,
  },
  container: { height: 42 },
  containerFallback: {
    flexDirection: 'row',
  },
  skeltonTag: {
    width: 100,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
});
