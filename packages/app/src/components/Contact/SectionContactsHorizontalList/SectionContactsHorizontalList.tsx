import { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ContactsScreenSection from './ContactsHorizontalList';
import type { ContactType } from '#helpers/contactTypes';
import type { ListRenderItemInfo, ViewStyle } from 'react-native';

type Props = {
  sections: Array<{
    title: string;
    count?: number;
    onSeeAll?: () => void;
    contacts: ContactType[];
  }>;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onShowContact: (contact: ContactType) => void;
  showContactAction: (arg: ContactType | ContactType[]) => void;
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
  contentContainerStyle?: ViewStyle;
};

const SectionContactsHorizontalList = ({
  sections,
  onEndReached,
  onRefresh,
  refreshing,
  onShowContact,
  showContactAction,
  showLocationInSubtitle,
  ListFooterComponent,
  ListHeaderComponent,
  contentContainerStyle,
}: Props) => {
  const renderItem = useCallback(
    ({
      item,
    }: ListRenderItemInfo<{
      title: string;
      count?: number;
      contacts: ContactType[];
      onSeeAll?: () => void;
    }>) => {
      return (
        <ContactsScreenSection
          contacts={item.contacts}
          onShowContact={onShowContact}
          title={item.title}
          showContactAction={showContactAction}
          onSeeAll={item.onSeeAll}
          count={item.count}
          showLocationInSubtitle={showLocationInSubtitle}
        />
      );
    },
    [showLocationInSubtitle, onShowContact, showContactAction],
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
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={[contentContainerStyle]}
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
