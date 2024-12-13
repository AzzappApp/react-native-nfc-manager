import {
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import {
  SOCIAL_LINKS,
  SocialLinksByCategory,
  socialLinkWebsite,
} from '@azzapp/shared/socialLinkHelpers';
import {
  isPhoneNumber,
  isValidEmail,
  isValidUrl,
} from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { DoneHeaderButton } from '#components/commonsButtons';
import {
  SOCIAL_LINK_ICON_BUTTON_HEIGHT,
  SocialLinkIconButton,
} from '#components/ui/SocialLinkIconButton';
import SocialLinkInput from '#components/ui/SocialLinkInput';
import SocialLinkInputPhone from '#components/ui/SocialLinkInputPhone';
import { useSocialMediaName } from '#hooks/ui/useSocialMediaName';
import useScreenInsets from '#hooks/useScreenInsets';
import Header from '#ui/Header';
import { SocialIcon } from '#ui/Icon';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type {
  SocialLinkCategory,
  SocialLinkCategoryId,
  SocialLinkId,
  SocialLinkItem,
  SocialLinkItemType,
} from '@azzapp/shared/socialLinkHelpers';
import type { ListRenderItemInfo } from 'react-native';

type LinkItemPickerProps = {
  onPress: (arg: SocialLinkItemType) => void;
};

/*
 * display the grid of available social links
 */
const LinkItemPicker = ({ onPress }: LinkItemPickerProps) => {
  const intl = useIntl();

  // local translations management
  const formatHeaderFromId = useCallback(
    (id: SocialLinkCategoryId) => {
      switch (id) {
        case 'URL':
          return intl.formatMessage({
            defaultMessage: 'URL',
            description: 'category of social link / Url',
          });
        case 'Contact':
          return intl.formatMessage({
            defaultMessage: 'Contact',
            description: 'category of social link / Contact',
          });
        case 'Social':
          return intl.formatMessage({
            defaultMessage: 'Social',
            description: 'category of social link / Social',
          });
        case 'Creative Platforms':
          return intl.formatMessage({
            defaultMessage: 'Creative Platforms',
            description: 'category of social link / Creative Platforms',
          });
        case 'Entertainment':
          return intl.formatMessage({
            defaultMessage: 'Entertainment',
            description: 'category of social link / Entertainment',
          });
        case 'Professional/Business':
          return intl.formatMessage({
            defaultMessage: 'Professional/Business',
            description: 'category of social link / Professional/Business',
          });
      }
    },
    [intl],
  );

  const renderSocialLinksItem = useCallback(
    ({ item }: ListRenderItemInfo<SocialLinkItemType>) => {
      return <SocialLinkIconButton item={item} onPress={onPress} />;
    },
    [onPress],
  );

  const renderFlatListItem = useCallback(
    ({ item }: ListRenderItemInfo<SocialLinkCategory>) => {
      const links = item.item;
      return (
        <View style={styles.lineContainer}>
          <Text variant="large" style={styles.lineLabel}>
            {formatHeaderFromId(item.id)}
          </Text>
          <FlatList
            showsHorizontalScrollIndicator={false}
            horizontal
            data={links}
            style={styles.categoryLine}
            renderItem={renderSocialLinksItem}
            keyExtractor={keyExtractorLinks}
            getItemLayout={getItemLayoutLinks}
          />
        </View>
      );
    },
    [formatHeaderFromId, renderSocialLinksItem],
  );

  return (
    <FlatList
      style={styles.flatlistContainer}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      renderItem={renderFlatListItem}
      data={SocialLinksByCategory}
      getItemLayout={getItemLayout}
    />
  );
};

const keyExtractor = (item: { id: string }) => item.id;
const getItemLayout = (
  _: ArrayLike<SocialLinkCategory> | null | undefined,
  index: number,
) => ({
  length: FLATLIST_ITEM_HEIGHT,
  offset: FLATLIST_ITEM_HEIGHT * index,
  index,
});

const keyExtractorLinks = (item: { id: string }) => item.id;
const getItemLayoutLinks = (
  _: ArrayLike<SocialLinkItemType> | null | undefined,
  index: number,
) => ({
  length: SOCIAL_LINK_ICON_BUTTON_HEIGHT,
  offset: SOCIAL_LINK_ICON_BUTTON_HEIGHT * index,
  index,
});

type SocialLinksAddOrEditModalProps = {
  links: SocialLinkItem[];
  pickedItem?: SocialLinkItem;
  setPickedItem: (arg: SocialLinkItem | undefined) => void;
  closeAddLink: () => void;
  onLinksChange: (arg: SocialLinkItem[]) => void;
};

/*
 * Handle the link creation or modification workflow
 * display the grid of media to pick and configuration view.
 * outside of this component every url shall be 'full url' with prefix and http
 */
export const SocialLinksAddOrEditModal = ({
  links,
  closeAddLink,
  onLinksChange,
  pickedItem,
  setPickedItem,
}: SocialLinksAddOrEditModalProps) => {
  const intl = useIntl();

  // current red error displayed
  const [error, setError] = useState<string>();

  // local link url & countryCode put in ref to avoid refreshes.
  // will be apply only when link cretion is finish
  const countryCodeRef = useRef<CountryCode>();
  const linkUrlRef = useRef('');

  const pickedItemType =
    SOCIAL_LINKS.find(s => s.id === pickedItem?.socialId) || socialLinkWebsite;

  const onLinkPress = (item: SocialLinkItemType) => {
    const maxPosition = Math.max(...links.map(l => l.position), 0);
    setPickedItem({ position: maxPosition + 1, socialId: item.id, link: '' });
  };

  const onCloseAddLink = () => {
    setPickedItem(undefined);
    closeAddLink();
  };

  const isNewLink =
    links.length === 0 ||
    links.some(link => link.position !== pickedItem?.position);

  const onBackToLinkList = () => {
    setError(undefined);
    if (isNewLink) {
      // The item is not yet in list we can close the panel
      setPickedItem(undefined);
    } else {
      onCloseAddLink();
    }
  };

  const onLinkUrlChanged = useCallback(
    (value: string) => {
      linkUrlRef.current = value;
      if (error) {
        setError(undefined);
      }
    },
    [error],
  );

  const onCountryCodeChange = (newCountryCode: CountryCode) => {
    countryCodeRef.current = newCountryCode;
  };

  const onLinkUrlValidated = () => {
    if (!pickedItem) return;
    const text = linkUrlRef.current;

    if (!text) {
      setError(
        intl.formatMessage({
          defaultMessage: 'Empty link is not valid.',
          description:
            'Error toast message when input of sociallink is not empty.',
        }),
      );
      return;
    }

    const validators = {
      website: (text: string) => {
        if (!isValidUrl('https://' + text)) {
          return intl.formatMessage({
            defaultMessage: 'The Website url is not valid.',
            description:
              'Error toast message when a website url sociallink is not valid.',
          });
        }
      },
      link: (text: string) => {
        if (!isValidUrl('https://' + text)) {
          return intl.formatMessage({
            defaultMessage: 'The Link url is not valid.',
            description: 'Error toast message when a link url is not valid.',
          });
        }
      },
      mail: (text: string) => {
        if (!isValidEmail(text)) {
          return intl.formatMessage({
            defaultMessage: 'The email is not valid.',
            description:
              'Error toast message when an email sociallink is not valid.',
          });
        }
      },
      phone: (text: string) => {
        if (!isPhoneNumber(text, countryCodeRef.current!)) {
          return intl.formatMessage({
            defaultMessage: 'The phone number is not valid.',
            description:
              'Error toast message when an phone number is not valid.',
          });
        }
      },
    } as Partial<Record<SocialLinkId, (text: string) => string | undefined>>;

    const validator = validators[pickedItem.socialId];
    if (validator && text) {
      const error = validator(text);
      if (error) {
        setError(error);
        return;
      }
    }

    let link = '';
    if (pickedItemType.id === 'phone' || pickedItemType.id === 'sms') {
      const parsedNumber = parsePhoneNumberFromString(linkUrlRef.current, {
        defaultCountry: countryCodeRef.current,
      });
      link = parsedNumber?.number as string;
    } else if (pickedItemType.id === 'mail') {
      link = linkUrlRef.current;
    } else {
      link = 'https://' + pickedItemType.mask + linkUrlRef.current;
    }
    const newItem: SocialLinkItem = {
      ...pickedItem,
      link,
    };
    const existingId = links.findIndex(l => newItem.position === l.position);
    const newLinks =
      existingId === -1
        ? [...links, newItem]
        : [
            ...links.slice(0, existingId),
            newItem,
            ...links.slice(existingId + 1, links.length),
          ];
    onLinksChange(newLinks);
    onCloseAddLink();
  };

  const headerDescription = useMemo(() => {
    if (pickedItemType.id === 'phone') {
      return intl.formatMessage({
        defaultMessage: 'Enter a phone number',
        description: 'Placeholder for the phone link',
      });
    }

    if (pickedItemType.id === 'sms') {
      return intl.formatMessage({
        defaultMessage: 'Enter a phone number',
        description: 'Placeholder for the sms link',
      });
    }

    if (pickedItemType.id === 'mail') {
      return intl.formatMessage({
        defaultMessage: 'Enter an email',
        description: 'Placeholder for the mail link',
      });
    }
    return intl.formatMessage(
      {
        defaultMessage: 'Enter a {socialLabel} url',
        description: 'Placeholder for the website link',
      },
      {
        socialLabel: pickedItemType.label,
      },
    );
  }, [intl, pickedItemType.id, pickedItemType.label]);

  const headerLabel = useSocialMediaName(pickedItemType);

  const { top } = useScreenInsets();
  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {pickedItem === undefined ? (
        <>
          <Header
            leftElement={
              <IconButton
                icon="arrow_down"
                onPress={onCloseAddLink}
                iconSize={28}
                variant="icon"
              />
            }
            middleElement={
              <Text variant="xlarge">
                <FormattedMessage
                  defaultMessage="Add a link"
                  description="LinkEditor - add new link Title"
                />
              </Text>
            }
          />
          <LinkItemPicker onPress={onLinkPress} />
        </>
      ) : (
        <>
          <Header
            leftElement={
              <IconButton
                icon={isNewLink ? 'arrow_left' : 'arrow_down'}
                onPress={onBackToLinkList}
                iconSize={28}
                variant="icon"
              />
            }
            middleElement={<Text variant="large">{headerLabel}</Text>}
            rightElement={<DoneHeaderButton onPress={onLinkUrlValidated} />}
          />
          <SocialIcon style={styles.socialIcon} icon={pickedItem.socialId} />
          <Text style={styles.headerText}>{headerDescription}</Text>
          <View style={styles.socialInput}>
            {pickedItem.socialId === 'phone' ||
            pickedItem.socialId === 'sms' ? (
              <SocialLinkInputPhone
                linkType={pickedItemType}
                onChangeLink={onLinkUrlChanged}
                defaultValue={pickedItem.link ?? ''}
                isErrored={!!error}
                onCountryCodeChange={onCountryCodeChange}
              />
            ) : (
              <SocialLinkInput
                linkType={pickedItemType}
                onChangeLink={onLinkUrlChanged}
                defaultValue={pickedItem.link}
                isErrored={!!error}
              />
            )}
            {error ? (
              <Text variant="small" style={styles.errorText}>
                {error}
              </Text>
            ) : undefined}
          </View>
        </>
      )}
    </View>
  );
};

const FLATLIST_ITEM_HEIGHT = 127;
const styles = StyleSheet.create({
  container: { rowGap: 10, overflow: 'visible', paddingBottom: 40 },
  flatlistContainer: {
    width: '100%',
    padding: 20,
  },
  lineContainer: {
    height: FLATLIST_ITEM_HEIGHT,
    width: '100%',
    overflow: 'visible',
  },
  lineLabel: { paddingBottom: 10 },
  headerText: {
    padding: 10,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  socialInput: {
    margin: 10,
  },
  socialIcon: { height: 44, width: 44, margin: 10, alignSelf: 'center' },
  errorText: { color: colors.red400, paddingTop: 25 },
  categoryLine: {
    overflow: 'visible',
  },
});
