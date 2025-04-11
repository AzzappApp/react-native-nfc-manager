import { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ContactsScreenSection from './ContactsHorizontalList';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from '../../../screens/ContactsScreen/ContactsScreenLists';
import type { ListRenderItemInfo } from 'react-native';

type Props = {
  sections: Array<{ title: string; data: ContactType[] }>;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onShowContact: (contact: ContactType) => void;
  showContactAction: (arg: ContactActionProps | undefined) => void;
  listFooterComponent: JSX.Element;
  onPressAll?: (title: string) => void;
  showLocationInSubtitle?: boolean;
};

const SectionContactsHorizontalList = ({
  sections,
  onEndReached,
  onRefresh,
  refreshing,
  onShowContact,
  showContactAction,
  listFooterComponent,
  onPressAll,
  showLocationInSubtitle,
}: Props) => {
  const styles = useStyleSheet(stylesheet);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<{ title: string; data: ContactType[] }>) => {
      return (
        <ContactsScreenSection
          data={item.data}
          onShowContact={onShowContact}
          title={item.title}
          showContactAction={showContactAction}
          onPressAll={onPressAll}
          showLocationInSubtitle={showLocationInSubtitle}
        />
      );
    },
    [showLocationInSubtitle, onPressAll, onShowContact, showContactAction],
  );

  return (
    <FlatList
      data={sections}
      keyExtractor={sectionKeyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      decelerationRate="fast"
      scrollEventThrottle={16}
      nestedScrollEnabled
      ItemSeparatorComponent={RenderSectionSeparator}
      ListFooterComponent={listFooterComponent}
    />
  );
};

const sectionKeyExtractor = (item: { title: string }) => {
  return item.title;
};

const RenderSectionSeparator = () => {
  const styles = useStyleSheet(stylesheet);
  return <View style={styles.separator} />;
};

const stylesheet = createStyleSheet(appearance => ({
  flex: { flex: 1 },
  content: {
    marginHorizontal: 10,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
  },
}));

export default SectionContactsHorizontalList;
