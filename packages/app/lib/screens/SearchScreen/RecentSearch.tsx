import { isNotFalsyString } from '@azzapp/shared/lib/stringHelpers';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { FlatList, Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '../../../theme';
import Icon from '../../ui/Icon';
import PressableBackground from '../../ui/PressableBackground';
import PressableNative from '../../ui/PressableNative';

type Props = {
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
}: Props) => {
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
    <FlatList<string>
      ListHeaderComponent={
        <Text style={[textStyles.title, styles.textStyleRecent]}>
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
        <Text style={[textStyles.button, styles.noRecentSearch]}>
          <FormattedMessage
            defaultMessage="No recent search for {word}"
            description="ResetSearch - message when no history search found"
            values={{ word: searchValue }}
          />
        </Text>
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
  const onRemove = async () => {
    await removeItem(item);
  };

  const onSearch = () => {
    search(item);
  };

  return (
    <PressableBackground style={styles.pressableRecentRow} onPress={onSearch}>
      <Text style={{ ...textStyles.sectionTitle }}>{item}</Text>
      <PressableNative onPress={onRemove}>
        <Icon icon="cross" style={{ height: 15, width: 15, marginRight: 25 }} />
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
    height: 39,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
});
