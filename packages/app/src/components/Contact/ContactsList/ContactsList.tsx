import { FlashList } from '@shopify/flash-list';
import { useCallback, useMemo } from 'react';
import { Platform, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ContactListEmptyComponent from '../ContactListEmptyComponent';
import ContactsListItem, { CONTACT_LIST_ITEM_HEIGHT } from './ContactsListItem';
import type { ContactsListItem_contact$key } from '#relayArtifacts/ContactsListItem_contact.graphql';
import type { FlashListProps, ListRenderItemInfo } from '@shopify/flash-list';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewStyle,
} from 'react-native';

export type ContactsListItemType = ContactsListItem_contact$key & {
  id: string;
};

export type ContactListProps = {
  sections: Array<{ title: string; data: ContactsListItemType[] }>;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onShowContact: (contactId: string) => void;
  onShowContactAction: (contactId: string) => void;
  renderSectionHeader: (title: string) => JSX.Element | null;
  headerHeight?: number;
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;
  ListFooterComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;
  contentContainerStyle?: ViewStyle;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ContactsList = ({
  sections,
  onEndReached,
  onRefresh,
  refreshing,
  onShowContact,
  onShowContactAction,
  renderSectionHeader,
  ListHeaderComponent,
  ListFooterComponent,
  contentContainerStyle,
  onScroll,
}: ContactListProps) => {
  const renderListItem = useCallback(
    ({ item }: ListRenderItemInfo<ContactsListItemType | string>) => {
      if (typeof item === 'string') {
        return renderSectionHeader(item);
      }
      return (
        <ContactsListItem
          contact={item}
          onShowContact={onShowContact}
          onShowContactAction={onShowContactAction}
        />
      );
    },
    [onShowContact, onShowContactAction, renderSectionHeader],
  );

  const { data, headerIndices } = useMemo(() => {
    const data: Array<ContactsListItemType | string> = [];
    const headerIndices: number[] = [];
    let index = 0;

    for (const section of sections) {
      headerIndices.push(index);
      data.push(section.title);
      index++;
      for (const item of section.data) {
        data.push(item);
        index++;
      }
    }
    return { data, headerIndices };
  }, [sections]);

  return (
    <AnimatedFlashList
      accessibilityRole="list"
      data={data}
      stickyHeaderIndices={
        // workaround for Android FlashList issue with sticky headers
        // see: https://github.com/Shopify/flash-list/issues/885
        Platform.OS === 'android' && refreshing ? [] : headerIndices
      }
      keyExtractor={sectionKeyExtractor}
      renderItem={renderListItem}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ItemSeparatorComponent={ItemSeparator}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="always"
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={{ flexGrow: 1, ...contentContainerStyle }}
      onScroll={onScroll}
      ListEmptyComponent={ContactListEmptyComponent}
      estimatedItemSize={CONTACT_LIST_ITEM_HEIGHT}
    />
  );
};

const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList as React.ComponentType<
    FlashListProps<ContactsListItemType | string>
  >,
);

const SEPARATOR_HEIGHT = 1;

const sectionKeyExtractor = (item: string | { id?: string }, index: number) => {
  return typeof item === 'string'
    ? `header-${index}`
    : item.id || `item-${index}`;
};

const ItemSeparator = () => {
  const styles = useStyleSheet(stylesheet);
  return <View style={styles.separator} />;
};

const stylesheet = createStyleSheet(appearance => ({
  separator: {
    height: SEPARATOR_HEIGHT,
    width: '100%',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
  },
}));

export default ContactsList;
