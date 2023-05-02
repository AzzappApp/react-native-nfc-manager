import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FlatList, StyleSheet } from 'react-native';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import Icon from '#ui/Icon';
import PressableBackground from '#ui/PressableBackground';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';

type RecentSearchProps = {
  searchValue: string | null | undefined;
  recentSearch: string[];
  removeSearch: (item: string) => Promise<void>;
  search: (item: string) => void;
};
const RecentSearch = ({
  searchValue,
  removeSearch,
  recentSearch,
  search,
}: RecentSearchProps) => {
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    if (isNotFalsyString(searchValue)) {
      const filteredSearch = searchValue!.toLocaleLowerCase().trim();
      setData(
        recentSearch.filter((s: string) =>
          s.toLocaleLowerCase().trim().includes(filteredSearch),
        ),
      );
    } else {
      setData(recentSearch);
    }
  }, [recentSearch, search, searchValue]);

  const renderRecentSearchItem = ({
    item,
  }: {
    item: string;
    index: number;
  }) => {
    return (
      <SearchRecentItem item={item} removeItem={removeSearch} search={search} />
    );
  };

  return (
    <FlatList
      testID="recent-search-list"
      accessibilityRole="list"
      ListHeaderComponent={
        <Text variant="large" style={styles.textStyleRecent}>
          <FormattedMessage
            defaultMessage="Recent searchs"
            description="ResetSearch - title "
          />
        </Text>
      }
      data={data}
      renderItem={renderRecentSearchItem}
      style={styles.root}
      ListEmptyComponent={
        searchValue ? (
          <Text variant="button" style={styles.noRecentSearch}>
            <FormattedMessage
              defaultMessage="No recent search for {word}"
              description="ResetSearch - message when no history search found"
              values={{ word: searchValue }}
            />
          </Text>
        ) : undefined
      }
    />
  );
};

type SearchRecentItemProps = {
  item: string;
  removeItem: (item: string) => Promise<void>;
  search: (item: string) => void;
};
const SearchRecentItem = ({
  item,
  removeItem,
  search,
}: SearchRecentItemProps) => {
  const intl = useIntl();
  const onRemove = async () => {
    await removeItem(item);
  };

  const onSearch = () => {
    search(item);
  };

  return (
    <PressableBackground
      style={styles.pressableRecentRow}
      onPress={onSearch}
      accessibilityRole="link"
      accessibilityLabel={intl.formatMessage(
        {
          defaultMessage: 'Tap to search for {word}',

          description:
            'Recent Search - Accessibiltity Label remove element from history',
        },
        { word: item },
      )}
    >
      <Text variant="medium">{item}</Text>
      <PressableNative
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={intl.formatMessage(
          {
            defaultMessage: 'Top to remove {word} from history',
            description:
              'Recent Search - Accessibiltity Label remove element from history',
          },
          { word: item },
        )}
      >
        <Icon icon="close" style={{ marginRight: 5 }} />
      </PressableNative>
    </PressableBackground>
  );
};

export default RecentSearch;

const styles = StyleSheet.create({
  root: { flex: 1 },
  textStyleRecent: {
    paddingTop: 5,
    paddingBottom: 5,
    marginTop: 15,
    marginBottom: 10,
    marginLeft: 14,
    marginRight: 15,
  },
  noRecentSearch: {
    margin: 15,
    color: colors.grey400,
  },
  pressableRecentRow: {
    backgroundColor: '#fff',
    height: 39,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
