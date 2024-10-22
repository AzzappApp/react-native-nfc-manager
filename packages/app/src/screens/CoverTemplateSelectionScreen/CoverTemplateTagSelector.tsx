import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import Skeleton from '#components/Skeleton';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import Text from '#ui/Text';
import type { CoverTemplateTagSelector_tags$key } from '#relayArtifacts/CoverTemplateTagSelector_tags.graphql';

type Props = {
  tags: CoverTemplateTagSelector_tags$key;
  onSelect: (tagId: string | null) => void;
  selected: string | null;
};

const CoverTemplateTagSelector = (props: Props) => {
  const { tags: tagsKey, onSelect, selected } = props;

  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);

  const tags = useFragment(
    graphql`
      fragment CoverTemplateTagSelector_tags on CoverTemplateTag
      @relay(plural: true) {
        id
        label
        description
      }
    `,
    tagsKey,
  );

  const clearSelected = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  const description = !selected
    ? intl.formatMessage({
        defaultMessage: 'All templates, with or without media to add',
        description: 'default template filter (all)',
      })
    : (tags.find(tag => tag.id === selected)?.description ?? ' ');
  return (
    <>
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
      <Text style={styles.description}>{description}</Text>
      <View style={styles.bottomLine} />
    </>
  );
};

export const CoverTemplateTagSelectorFallback = () => {
  const styles = useStyleSheet(styleSheet);
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

const styleSheet = createStyleSheet(appearance => ({
  contentContainerScrollView: {
    paddingHorizontal: 20,
    gap: 10,
  },
  bottomLine: {
    marginTop: 10,
    borderColor: appearance === 'dark' ? colors.grey900 : colors.grey50,
    borderWidth: 1,
  },
  container: { height: 42, marginVertical: 10 },
  containerFallback: {
    flexDirection: 'row',
  },
  skeltonTag: {
    width: 100,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  description: {
    textAlign: 'center',
    color: colors.grey400,
    backgroundColor: 'transparent',
    marginVertical: 5,
  },
}));
