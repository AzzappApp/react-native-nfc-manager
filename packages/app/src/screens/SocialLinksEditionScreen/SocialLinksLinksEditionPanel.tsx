import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import SortableList from '#components/SortableScrollView/SortableScrollView';
import { SOCIAL_LINKS } from '#helpers/socialLinkHelpers';
import useEditorLayout from '#hooks/useEditorLayout';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Icon from '#ui/Icon';
import SocialIcon from '#ui/Icon/SocialIcon';
import Input from '#ui/Input';
import Text from '#ui/Text';
import TitleWithLine from '#ui/TitleWithLine';
import type { SocialIcons } from '#ui/Icon/SocialIcon';
import type { SocialLinkInput } from '@azzapp/relay/artifacts/SocialLinksEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps, LayoutChangeEvent } from 'react-native';
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
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
};

/**
 * A Panel to edit the Links of the SocialLinks edition screen
 */
const SocialLinksLinksEditionPanel = ({
  links,
  onLinksChange,
  style,
  ...props
}: SocialLinksLinksEditionPanelProps) => {
  const intl = useIntl();
  const { insetBottom } = useEditorLayout();

  const onChangeLink = (id: SocialIcons, value: string) => {
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

  const colorScheme = useColorScheme();

  const data = useMemo(() => {
    // consolidate a list of link merged with the selected value
    const consolidatedLinks = [];
    for (let index = 0; index < SOCIAL_LINKS.length; index++) {
      const link = SOCIAL_LINKS[index];
      const value = links.find(item => item?.socialId === link.id);
      consolidatedLinks.push({
        ...link,
        position: NO_POSITION_INDEX,
        ...value,
      });
    }
    return consolidatedLinks.sort((a, b) => {
      if (a.position === b.position) {
        return a.id.localeCompare(b.id);
      } else {
        return a.position - b.position;
      }
    });
  }, [links]);

  const renderItem = (
    item: {
      id: SocialIcons;
      link?: string | undefined;
      position: number;
      mask: string;
    },
    panGesture: PanGesture,
  ) => {
    const value = links.find(link => link?.socialId === item.id)?.link ?? '';

    const onFocus = () => {
      if (item.id === 'website' && !isNotFalsyString(item.link)) {
        onChangeLink(item.id, 'https://');
      }
    };

    return (
      <View
        key={item.id}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 56,
        }}
      >
        <SocialIcon
          icon={item.id as SocialIcons}
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
              {item.mask}
            </Text>
          }
          clearButtonMode="always"
          value={value}
          onChangeText={link => onChangeLink(item.id as SocialIcons, link)}
          autoCapitalize="none"
          inputStyle={{ paddingLeft: 0 }}
          onPressIn={onFocus}
        />
        <GestureDetector gesture={panGesture}>
          <Icon icon="menu" style={{ tintColor: colors.grey400 }} />
        </GestureDetector>
      </View>
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
        id: SocialIcons;
        link?: string | undefined;
        position: number;
        mask: string;
      }>
        items={data}
        itemHeight={56}
        renderItem={renderItem}
        visibleHeight={scrollHeight - BOTTOM_MENU_HEIGHT - insetBottom}
        contentContainerStyle={{
          height:
            56 * SOCIAL_LINKS.length + BOTTOM_MENU_HEIGHT + insetBottom + 20,
        }}
        onLayout={onLayout}
        onChangeOrder={onChangeOrder}
      />
    </View>
  );
};

export default SocialLinksLinksEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
});

const NO_POSITION_INDEX = 100;
