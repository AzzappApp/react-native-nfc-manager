import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FlatList, View } from 'react-native';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableBackground from '#ui/PressableBackground';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';

type RecentSearchProps = {
  searchValue: string | null | undefined;
  recentSearch: string[];
  removeSearch: (item: string) => void;
  search: (item: string) => void;
};
const RecentSearch = ({
  searchValue,
  removeSearch,
  recentSearch,
  search,
}: RecentSearchProps) => {
  const styles = useStyleSheet(styleSheet);

  const data = useMemo(() => {
    if (isNotFalsyString(searchValue)) {
      const filteredSearch = searchValue!.toLocaleLowerCase().trim();
      return recentSearch.filter((s: string) =>
        s.toLocaleLowerCase().trim().includes(filteredSearch),
      );
    } else {
      return recentSearch;
    }
  }, [recentSearch, searchValue]);

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
    <View style={{ flex: 1 }}>
      <FlatList
        testID="recent-search-list"
        accessibilityRole="list"
        keyboardShouldPersistTaps="always"
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
    </View>
  );
};

type SearchRecentItemProps = {
  item: string;
  removeItem: (item: string) => void;
  search: (item: string) => void;
};
const SearchRecentItem = ({
  item,
  removeItem,
  search,
}: SearchRecentItemProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
  const onRemove = useCallback(() => {
    removeItem(item);
  }, [item, removeItem]);

  const onSearch = useCallback(() => {
    search(item);
  }, [item, search]);

  return (
    <PressableBackground
      style={styles.pressableRecentRow}
      onPress={onSearch}
      highlightColor={colors.grey400}
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

const styleSheet = createStyleSheet(appearance => ({
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
    backgroundColor: appearance === 'light' ? colors.white : colors.black, //required to have a bg color for pressable
    height: 39,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));
