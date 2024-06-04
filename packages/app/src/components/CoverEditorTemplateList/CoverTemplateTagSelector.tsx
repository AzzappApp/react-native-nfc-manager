import { useIntl } from 'react-intl';
import { ScrollView, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import type { CoverTemplateTagSelector_tags$key } from '#relayArtifacts/CoverTemplateTagSelector_tags.graphql';

type Props = {
  tagsKey: CoverTemplateTagSelector_tags$key;
  onSelect: (labelId: string | null) => void;
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

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View
        style={{
          display: 'flex',
          gap: 10,
          flexDirection: 'row',
          paddingHorizontal: 20,
        }}
      >
        <RoundedMenuComponent
          selected={selected === null}
          label={intl.formatMessage({
            defaultMessage: 'All',
            description: 'CoverTemplateTagSelector - All',
          })}
          onPress={() => {
            onSelect(null);
          }}
        />
        {tags?.map(({ id, label }) => (
          <RoundedMenuComponent
            key={id}
            selected={id === selected}
            label={label!}
            onPress={() => {
              onSelect(id);
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default CoverTemplateTagSelector;
