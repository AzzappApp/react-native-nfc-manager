import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FlatList, StyleSheet, View } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import { colors } from '#theme';
import { getFriendlyNameFromLocation } from '#helpers/contactHelpers';
import { keyExtractor } from '#helpers/idHelpers';
import Button from '#ui/Button';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactHorizontalItem from './ContactHorizontalItem';
import type { ContactType } from '#helpers/contactTypes';
import type { ListRenderItemInfo } from 'react-native';

type ContactsScreenSectionProps = {
  title: string;
  count?: number;
  contacts: ContactType[];
  onShowContact: (contact: ContactType) => void;
  showContactAction: (arg: ContactType | ContactType[]) => void;
  showLocationInSubtitle?: boolean;
  onSeeAll?: () => void;
};

const ContactsScreenSection = ({
  title,
  count,
  contacts,
  onShowContact,
  showContactAction,
  onSeeAll,
  showLocationInSubtitle,
}: ContactsScreenSectionProps) => {
  const renderProfile = useCallback(
    ({ item }: ListRenderItemInfo<ContactType>) => {
      return (
        <ContactHorizontalItem
          contact={item}
          onShowContact={onShowContact}
          showContactAction={showContactAction}
        />
      );
    },
    [onShowContact, showContactAction],
  );

  const intl = useIntl();

  // locations to display at the end of the detail line
  const locations = showLocationInSubtitle
    ? Array.from(
        new Set(
          contacts
            .map(x => getFriendlyNameFromLocation(x.meetingPlace))
            .filter(isDefined),
        ),
      )
        .sort((x, y) => (x > y ? 1 : -1))
        .reduce((acc, item) => `${acc} - ${item}`, '')
    : '';

  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <View>
          <Text variant="large">{title}</Text>
          <Text variant="small" style={styles.count}>
            <FormattedMessage
              defaultMessage="{contacts, plural,
                =0 {# contacts received}
                =1 {# contact received}
                other {# contacts received}
              }"
              description="ContactsScreen - Contacts counter under section by location or date"
              values={{ contacts: count ?? contacts.length }}
            />
            {locations}
          </Text>
        </View>
        {/* This functionality is disabled for now, since not all contacts are
          loaded anymore. So action needs to be refactored to adapt the new logic */}
        {/* <PressableNative onPress={onMore}>
          <Icon icon="more" />
        </PressableNative> */}
      </View>

      <FlatList
        data={contacts}
        keyExtractor={keyExtractor}
        renderItem={renderProfile}
        horizontal
        contentContainerStyle={styles.profiles}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled
        ListFooterComponent={
          onSeeAll ? (
            <PressableNative style={styles.morePlaceHolder} onPress={onSeeAll}>
              <LinearGradient
                colors={[`${colors.grey1000}FF`, `${colors.grey1000}00`]}
                style={styles.morePlaceHolderBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text variant="medium" style={styles.morePlaceHolderText}>
                  + {(count ?? contacts.length) - contacts.length}
                </Text>
              </LinearGradient>
            </PressableNative>
          ) : null
        }
      />
      {onSeeAll ? (
        <View style={styles.seeAll}>
          <Button
            variant="little_round"
            label={intl.formatMessage({
              defaultMessage: 'See all',
              description: 'See all found contacts',
            })}
            onPress={onSeeAll}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    color: colors.grey400,
    marginTop: 5,
  },
  profiles: {
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 5,
  },
  seeAll: {
    position: 'absolute',
    right: 12,
    top: '40%',
  },
  morePlaceHolder: {
    width: 80,
    height: 80 / COVER_RATIO,
    marginRight: 80,
    borderRadius: COVER_CARD_RADIUS * 80,
    overflow: 'hidden',
  },
  morePlaceHolderBackground: {
    width: 80,
    height: 80 / COVER_RATIO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePlaceHolderText: {
    color: colors.white,
    textAlign: 'center',
  },
});

export default ContactsScreenSection;
