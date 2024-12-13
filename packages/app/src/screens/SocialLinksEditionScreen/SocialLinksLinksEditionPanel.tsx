import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { colors } from '#theme';
import SortableList from '#components/SortableScrollView/SortableScrollView';
import { SocialLinkIconButton } from '#components/ui/SocialLinkIconButton';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import TitleWithLine from '#ui/TitleWithLine';
import type { SocialLinkItem } from '@azzapp/shared/socialLinkHelpers';
import type { ViewProps, StyleProp, ViewStyle } from 'react-native';
import type { PanGestureType } from 'react-native-gesture-handler/lib/typescript/handlers/gestures/panGesture';

type SocialLinksLinksEditionPanelProps = ViewProps & {
  /**
   * The links currently set on the module
   */
  links: SocialLinkItem[];
  /**
   * A callback called when the user update the links
   */
  onDeleteLink: (links: SocialLinkItem) => void;
  onItemPress: (link: SocialLinkItem) => void;
  onOrderChange: (links: SocialLinkItem[]) => void;
  onAddLink: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  ignoreKeyboard?: boolean;
  showTitleWithLineHeader?: boolean;
  maxLink?: number;
};

/**
 * A Panel to edit the Links of the SocialLinks edition screen
 */
const SocialLinksLinksEditionPanel = ({
  links,
  onDeleteLink,
  onAddLink,
  onItemPress,
  onOrderChange,
  style,
  contentContainerStyle,
  ignoreKeyboard,
  showTitleWithLineHeader,
  maxLink = -1,
  ...props
}: SocialLinksLinksEditionPanelProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);

  const onChangeOrder = (arr: SocialLinkItem[]) => {
    const orderedList: SocialLinkItem[] = arr
      .sort((a, b) => a.position - b.position)
      // filterout keyId
      .map(item => ({
        link: item.link,
        position: item.position,
        socialId: item.socialId,
      }));
    onOrderChange(orderedList);
  };

  const sortableLinks = links
    .sort((a, b) => a.position - b.position)
    .map((l, index) => {
      return { ...l, position: index, keyId: `${l.link}${l.socialId}${index}` };
    });

  const { width } = useScreenDimensions();
  const visibleDimension = width;
  const { bottom } = useScreenInsets();

  const scrollableStyle: ViewStyle = {
    overflow: 'visible',
    paddingBottom: maxLink <= 0 ? 30 : 0,
    paddingTop: maxLink <= 0 ? 30 : 0,
    maxHeight: 172 - bottom,
  };

  const onPress = useCallback(
    (item: {
      position: number;
      keyId: string;
      socialId: string;
      link: string;
    }) => {
      const { keyId, ...rest } = item;
      onItemPress(rest);
    },
    [onItemPress],
  );

  const renderItem = useCallback(
    (
      item: {
        position: number;
        keyId: string;
        socialId: string;
        link: string;
      },
      panGesture: PanGestureType,
    ) => {
      return (
        <GestureDetector gesture={panGesture}>
          <View style={styles.itemContainer}>
            <SocialLinkIconButton
              item={item}
              onPress={onPress}
              showDelete
              onDeletePress={onDeleteLink}
            />
          </View>
        </GestureDetector>
      );
    },
    [onDeleteLink, onPress, styles.itemContainer],
  );

  return (
    <View style={[styles.root, style]} {...props}>
      {showTitleWithLineHeader ? (
        <TitleWithLine
          title={intl.formatMessage({
            defaultMessage: 'Links',
            description: 'Title of the Links section in SocialLinks edition',
          })}
        />
      ) : undefined}
      <SortableList
        items={sortableLinks}
        itemDimension={90}
        visibleDimension={visibleDimension}
        showsHorizontalScrollIndicator={false}
        horizontal
        contentContainerStyle={styles.scrollableListContainer}
        style={scrollableStyle}
        activateAfterLongPress
        renderItem={renderItem}
        onChangeOrder={onChangeOrder}
      />
      {maxLink > 0 && (
        <Text variant="medium" style={styles.linksPreviewCount}>
          <FormattedMessage
            defaultMessage="{links}/{maxLink} links"
            description="CoverEditorLinksModal - Links count"
            values={{ links: links.length, maxLink }}
          />
        </Text>
      )}
      <View style={styles.iconContainer}>
        <IconButton
          icon="add"
          onPress={onAddLink}
          disabled={maxLink > 0 && links.length >= maxLink}
        />
      </View>
    </View>
  );
};

export default SocialLinksLinksEditionPanel;

const styleSheet = createStyleSheet(appearance => ({
  root: {
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  iconContainer: {
    width: '100%',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollableListContainer: {
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  pressableSocialIcon: {
    paddingHorizontal: 5,
  },
  linksPreviewCount: {
    textAlign: 'center',
    color: appearance === 'light' ? colors.grey400 : colors.grey600,
  },
  itemContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export const SOCIAL_LINK_PANEL_ITEM_HEIGHT = 56;
