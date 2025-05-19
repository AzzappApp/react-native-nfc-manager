import { useCallback } from 'react';
import { SectionList, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ContactsListItem from './ContactsListItem';
import type { ContactType } from '#helpers/contactTypes';
import type {
  SectionListData,
  SectionListRenderItemInfo,
  ViewStyle,
} from 'react-native';

type Props = {
  sections: Array<{ title: string; data: ContactType[] }>;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onShowContact: (contact: ContactType) => void;
  showContactAction: (arg: ContactType) => void;
  renderSectionHeader: (args: {
    section: SectionListData<
      ContactType,
      { title: string; data: ContactType[] }
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
};

const ContactsList = ({
  sections,
  onEndReached,
  onRefresh,
  refreshing,
  onShowContact,
  showContactAction,
  renderSectionHeader,
  ListHeaderComponent,
  ListFooterComponent,
  contentContainerStyle,
}: Props) => {
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
      ItemSeparatorComponent={ItemSeparator}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="always"
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={contentContainerStyle}
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
