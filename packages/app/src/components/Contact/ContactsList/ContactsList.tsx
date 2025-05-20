import { useCallback } from 'react';
import { SectionList, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ContactsListItem from './ContactsListItem';
import type { ContactsListItem_contact$key } from '#relayArtifacts/ContactsListItem_contact.graphql';
import type {
  ScrollViewProps,
  SectionListData,
  SectionListRenderItemInfo,
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
  renderSectionHeader: (args: {
    section: SectionListData<
      ContactsListItemType,
      { title: string; data: ContactsListItemType[] }
    >;
  }) => JSX.Element | null;
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
  renderScrollComponent?:
    | ((props: ScrollViewProps) => React.ReactElement<ScrollViewProps>)
    | undefined;
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
  renderScrollComponent,
}: ContactListProps) => {
  const renderListItem = useCallback(
    ({
      item,
    }: SectionListRenderItemInfo<
      ContactsListItemType,
      { title: string; data: ContactsListItemType[] }
    >) => {
      return (
        <ContactsListItem
          contact={item}
          onShowContact={onShowContact}
          onShowContactAction={onShowContactAction}
        />
      );
    },
    [onShowContactAction, onShowContact],
  );

  return (
    <SectionList
      accessibilityRole="list"
      sections={sections}
      keyExtractor={sectionKeyExtractor}
      renderItem={renderListItem}
      renderSectionHeader={renderSectionHeader}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ItemSeparatorComponent={ItemSeparator}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="always"
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={contentContainerStyle}
      renderScrollComponent={renderScrollComponent}
    />
  );
};

const sectionKeyExtractor = (item: { id?: string }, index: number) => {
  return item.id ?? `${index}`;
};

const ItemSeparator = () => {
  const styles = useStyleSheet(stylesheet);
  return <View style={styles.separator} />;
};

const stylesheet = createStyleSheet(appearance => ({
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
  },
}));

export default ContactsList;
