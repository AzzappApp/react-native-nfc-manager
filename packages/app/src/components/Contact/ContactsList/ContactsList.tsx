import { useCallback } from 'react';
import { SectionList, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ContactsListItem from './ContactsListItem';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from '#screens/ContactsScreen/ContactsScreenLists';
import type { SectionListData, SectionListRenderItemInfo } from 'react-native';

type Props = {
  sections: Array<{ title: string; data: ContactType[] }>;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onShowContact: (contact: ContactType) => void;
  showContactAction: (arg: ContactActionProps | undefined) => void;
  listFooterComponent: JSX.Element;
  renderSectionHeader: (args: {
    section: SectionListData<
      ContactType,
      { title: string; data: ContactType[] }
    >;
  }) => JSX.Element | null;
};

const ContactsList = ({
  sections,
  onEndReached,
  onRefresh,
  refreshing,
  onShowContact,
  showContactAction,
  listFooterComponent,
  renderSectionHeader,
}: Props) => {
  const styles = useStyleSheet(stylesheet);

  const renderListItem = useCallback(
    ({
      item,
    }: SectionListRenderItemInfo<
      ContactType,
      { title: string; data: ContactType[] }
    >) => {
      return (
        <ContactsListItem
          contact={item}
          onShowContact={onShowContact}
          showContactAction={showContactAction}
        />
      );
    },
    [showContactAction, onShowContact],
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
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={ItemSeparator}
      ListFooterComponent={listFooterComponent}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="always"
    />
  );
};

const sectionKeyExtractor = (item: { id: string }) => {
  return item.id;
};
const ItemSeparator = () => {
  const styles = useStyleSheet(stylesheet);
  return <View style={styles.separator} />;
};

const stylesheet = createStyleSheet(appearance => ({
  content: {
    paddingHorizontal: 10,
  },
  flex: { flex: 1 },
  title: {
    marginVertical: 20,
    textTransform: 'uppercase',
  },
  section: {
    margin: 20,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
  },
}));

export default ContactsList;
