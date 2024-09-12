import { memo, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useDebouncedCallback } from 'use-debounce';
import { SOCIAL_LINKS } from '@azzapp/shared/socialLinkHelpers';
import {
  isNotFalsyString,
  isValidEmail,
  isValidUrl,
} from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import SortableList from '#components/SortableScrollView/SortableScrollView';
import useEditorLayout from '#hooks/useEditorLayout';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Icon from '#ui/Icon';
import SocialIcon from '#ui/Icon/SocialIcon';
import Input from '#ui/Input';
import Text from '#ui/Text';
import TitleWithLine from '#ui/TitleWithLine';
import type { SocialLinkInput } from '#relayArtifacts/SocialLinksEditionScreenUpdateModuleMutation.graphql';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';
import type {
  ViewProps,
  LayoutChangeEvent,
  TextInputEndEditingEventData,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import type { PanGesture } from 'react-native-gesture-handler';

type SocialLinksLinksEditionPanelProps = ViewProps & {
  /**
   * The links currently set on the module
   */
  links: ReadonlyArray<{
    readonly socialId: string;
    readonly link: string;
    readonly position: number;
  } | null>;
  /**
   * A callback called when the user update the links
   */
  onLinksChange: (links: Array<SocialLinkInput | null>) => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * A Panel to edit the Links of the SocialLinks edition screen
 */
const SocialLinksLinksEditionPanel = ({
  links,
  onLinksChange,
  style,
  contentContainerStyle,
  ...props
}: SocialLinksLinksEditionPanelProps) => {
  const intl = useIntl();
  const { insetBottom } = useEditorLayout();

  const onChangeLink = (id: SocialLinkId, value: string) => {
    if (isNotFalsyString(value)) {
      const item = links.find(link => link?.socialId === id);

      //add value to item link
      if (item) {
        const newLinks = links.map(link => {
          if (link?.socialId === id) {
            return {
              ...link,
              link: value,
            };
          }
          return link;
        });
        onLinksChange(newLinks);
      } else {
        onLinksChange([
          ...links,
          { socialId: id, link: value, position: links.length },
        ]);
      }
    } else {
      onLinksChange(links.filter(link => link?.socialId !== id));
    }
  };

  const data = useMemo(() => {
    // consolidate a list of link merged with the selected value
    const consolidatedLinks = [];
    for (let index = 0; index < SOCIAL_LINKS.length; index++) {
      const link = SOCIAL_LINKS[index];
      const value = links.find(item => item?.socialId === link.id);

      let placeholder: string | undefined = undefined;

      if (link.id === 'website') {
        placeholder = intl.formatMessage({
          defaultMessage: 'Enter an URL',
          description: 'Placeholder for the website link',
        });
      }

      if (link.id === 'phone') {
        placeholder = intl.formatMessage({
          defaultMessage: 'Enter a phone number',
          description: 'Placeholder for the phone link',
        });
      }

      if (link.id === 'sms') {
        placeholder = intl.formatMessage({
          defaultMessage: 'Enter a phone number',
          description: 'Placeholder for the sms link',
        });
      }

      if (link.id === 'mail') {
        placeholder = intl.formatMessage({
          defaultMessage: 'Enter an email',
          description: 'Placeholder for the mail link',
        });
      }
      if (link.id === 'website') {
        placeholder = intl.formatMessage({
          defaultMessage: 'Enter a website url',
          description: 'Placeholder for the website link',
        });
      }

      consolidatedLinks.push({
        ...link,
        position: NO_POSITION_INDEX,
        ...value,
        placeholder,
      });
    }
    return consolidatedLinks.sort((a, b) => {
      if (a.position === b.position) {
        return a.id.localeCompare(b.id);
      } else {
        return a.position - b.position;
      }
    });
  }, [intl, links]);

  const renderItem = (
    item: {
      id: SocialLinkId;
      link?: string | undefined;
      position: number;
      mask: string;
      placeholder?: string;
    },
    panGesture: PanGesture,
  ) => {
    const value = links.find(link => link?.socialId === item.id)?.link ?? '';
    return (
      <SocialInput
        icon={item.id}
        mask={item.mask}
        placeholder={item.placeholder}
        value={value}
        onChangeLink={onChangeLink}
        panGesture={panGesture}
      />
    );
  };

  const onChangeOrder = (
    arr: Array<{
      id: string;
      link?: string | undefined;
      position: number;
      mask: string;
    }>,
  ) => {
    //update the position of items in link
    const newLinks = links.map(link => {
      const item = arr.find(item => item.id === link?.socialId);
      if (item && link) {
        return {
          ...link,
          position: item.position,
        };
      }
      return link;
    });
    onLinksChange(newLinks);
  };

  const [scrollHeight, setScrollHeight] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setScrollHeight(event.nativeEvent.layout.height);
  }, []);

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Links',
          description: 'Title of the Links section in SocialLinks edition',
        })}
      />
      <SortableList<{
        id: SocialLinkId;
        link?: string | undefined;
        position: number;
        mask: string;
      }>
        items={data}
        itemHeight={SOCIAL_LINK_PANEL_ITEM_HEIGHT}
        renderItem={renderItem}
        visibleHeight={scrollHeight - BOTTOM_MENU_HEIGHT - insetBottom}
        contentContainerStyle={
          contentContainerStyle ?? {
            height:
              SOCIAL_LINK_PANEL_ITEM_HEIGHT * SOCIAL_LINKS.length +
              insetBottom +
              BOTTOM_MENU_HEIGHT +
              20,
          }
        }
        onLayout={onLayout}
        onChangeOrder={onChangeOrder}
      />
    </View>
  );
};

const SocialInputComponent = ({
  icon,
  mask,
  value,
  onChangeLink,
  panGesture,
  placeholder,
}: {
  icon: SocialLinkId;
  mask: string;
  placeholder?: string;
  value: string;
  onChangeLink: (id: SocialLinkId, value: string) => void;
  panGesture: PanGesture;
}) => {
  const colorScheme = useColorScheme();
  const [localValue, setLocalValue] = useState(value);

  const debouncedChangeLink = useDebouncedCallback(onChangeLink, 500, {
    leading: true,
  });

  const onChangeText = useCallback(
    (value: string) => {
      value = value.trim();
      //handle copy paste from the user with complete link
      let filterText = value;
      if (value.includes(mask)) {
        const index = value.indexOf(mask);
        filterText = value.substring(index + mask.length);
        const endIndex = filterText.indexOf('?');
        if (endIndex !== -1) {
          filterText = filterText.substring(0, endIndex);
        }
      }

      if (
        isNotFalsyString(filterText) &&
        icon === 'website' &&
        !localValue.includes('http')
      ) {
        filterText = 'https://' + (filterText === 'h' ? '' : filterText);
      }
      setLocalValue(filterText);
      if (icon !== 'mail') {
        debouncedChangeLink(icon, filterText);
      }
    },
    [debouncedChangeLink, icon, localValue, mask],
  );

  const intl = useIntl();

  const onEndEditing = useCallback(
    async (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
      const validators = {
        website: (text: string) => {
          if (!isValidUrl(text)) {
            return intl.formatMessage({
              defaultMessage: 'The Website url is not valid.',
              description:
                'Error toast message when a website url sociallink is not valid.',
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
      } as Partial<Record<SocialLinkId, (text: string) => string | undefined>>;

      const validator = validators[icon];
      if (validator && e.nativeEvent.text) {
        const error = validator(e.nativeEvent.text);

        if (error) {
          return Toast.show({
            type: 'error',
            text1: error,
          });
        }
      }

      onChangeLink(icon, e.nativeEvent.text);
    },
    [icon, intl, onChangeLink],
  );

  return (
    <View
      key={icon}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
      }}
    >
      <SocialIcon
        icon={icon}
        style={{
          width: 30,
          height: 30,
          tintColor: isNotFalsyString(value)
            ? colorScheme === 'dark'
              ? colors.white
              : colors.black
            : colors.grey400,
        }}
      />

      <Input
        style={{ flex: 1, marginLeft: 5, marginRight: 5 }}
        leftElement={
          <Text variant="textField" style={{ color: colors.grey400 }}>
            {mask}
          </Text>
        }
        placeholder={placeholder}
        clearButtonMode="always"
        value={localValue}
        onChangeText={onChangeText}
        onEndEditing={onEndEditing}
        autoCapitalize="none"
        autoCorrect={false}
        inputStyle={styles.inputStyleSocial}
      />
      <GestureDetector gesture={panGesture}>
        <Icon icon="menu" style={{ tintColor: colors.grey400 }} />
      </GestureDetector>
    </View>
  );
};

const SocialInput = memo(SocialInputComponent);

export default SocialLinksLinksEditionPanel;

const styles = StyleSheet.create({
  inputStyleSocial: { paddingLeft: 0 },
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
});

const NO_POSITION_INDEX = 100;

export const SOCIAL_LINK_PANEL_ITEM_HEIGHT = 56;
