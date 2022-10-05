import { isNotFalsyString } from '@azzapp/shared/lib/stringHelpers';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { FlatList, Text, View, Pressable, StyleSheet } from 'react-native';

import { textStyles } from '../../../theme';
import Icon from '../../ui/Icon';

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
        <Text style={styles.textStyleRecent}>
          <FormattedMessage
            defaultMessage="Recent searchs"
            description="ResetSearch - title "
          />
        </Text>
      }
      data={data}
      renderItem={renderRecentSearchItem}
      style={styles.flexOne}
      ListEmptyComponent={
        <View>
          <Text>
            <FormattedMessage
              defaultMessage="No recent search for {word}"
              description="ResetSearch - message when no history search found"
              values={{ word: searchValue }}
            />
          </Text>
        </View>
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
    <Pressable
      style={{
        height: 39,
        marginLeft: 5,
        marginRight: 5,
        paddingLeft: 9,
        paddingRight: 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onPress={onSearch}
    >
      <Text style={{ ...textStyles.sectionTitle }}>{item}</Text>
      <Pressable onPress={onRemove}>
        <Icon icon="cross" style={{ height: 15, width: 15, marginRight: 25 }} />
      </Pressable>
    </Pressable>
  );
};

export default RecentSearch;

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  textStyleRecent: {
    paddingTop: 5,
    paddingBottom: 5,
    marginTop: 15,
    marginBottom: 10,
    marginLeft: 14,
    marginRight: 15,
  },
});
