import { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ContactListEmptyComponent from '../ContactListEmptyComponent';
import ContactsScreenSection from './ContactsHorizontalList';
import type { ContactsHorizontalList_contacts$key } from '#relayArtifacts/ContactsHorizontalList_contacts.graphql';
import type {
  ListRenderItemInfo,
  ScrollViewProps,
  ViewStyle,
} from 'react-native';

type Props = {
  sections: Array<{
    title: string;
    count?: number;
    onSeeAll?: () => void;
    contacts: ContactsHorizontalList_contacts$key;
  }>;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onShowContact: (contactId: string) => void;
  onShowContactAction: (arg: string[] | string) => void;
  showLocationInSubtitle?: boolean;
  ListFooterComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;
  renderScrollComponent?:
    | ((props: ScrollViewProps) => React.ReactElement<ScrollViewProps>)
    | undefined;
  contentContainerStyle?: ViewStyle;
};

const SectionContactsHorizontalList = ({
  sections,
  onEndReached,
  onRefresh,
  refreshing,
  onShowContact,
  onShowContactAction,
  showLocationInSubtitle,
  ListFooterComponent,
  ListHeaderComponent,
  renderScrollComponent,
  contentContainerStyle,
}: Props) => {
  const renderItem = useCallback(
    ({
      item,
    }: ListRenderItemInfo<{
      title: string;
      count?: number;
      contacts: ContactsHorizontalList_contacts$key;
      onSeeAll?: () => void;
    }>) => {
      return (
        <ContactsScreenSection
          contacts={item.contacts}
          onShowContact={onShowContact}
          title={item.title}
          onShowContactAction={onShowContactAction}
          onSeeAll={item.onSeeAll}
          count={item.count}
          showLocationInSubtitle={showLocationInSubtitle}
        />
      );
    },
    [showLocationInSubtitle, onShowContact, onShowContactAction],
  );

  return (
    <FlatList
      data={sections}
      keyExtractor={sectionKeyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      decelerationRate="fast"
      scrollEventThrottle={16}
      nestedScrollEnabled
      ItemSeparatorComponent={RenderSectionSeparator}
      renderScrollComponent={renderScrollComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      style={{ flexGrow: 1 }}
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      ListEmptyComponent={ContactListEmptyComponent}
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
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
  },
}));

export default SectionContactsHorizontalList;
