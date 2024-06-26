import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, View, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import type { CoverTemplateTagSelector_tags$key } from '#relayArtifacts/CoverTemplateTagSelector_tags.graphql';

type Props = {
  tagsKey: CoverTemplateTagSelector_tags$key;
  onSelect: (tagId: string | null) => void;
  selected: string | null;
};

const CoverTemplateTagSelector = (props: Props) => {
  const { tagsKey, onSelect, selected } = props;

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
            key={`covertempaltetagselector_${id}`}
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

export default CoverTemplateTagSelector;

const styles = StyleSheet.create({
  contentContainerScrollView: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 10,
  },
  container: { height: 52 },
});
