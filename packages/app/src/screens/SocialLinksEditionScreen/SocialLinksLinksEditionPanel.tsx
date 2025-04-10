import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, {
  useAnimatedRef,
  useSharedValue,
} from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { colors } from '#theme';
import { SocialLinkIconButton } from '#components/ui/SocialLinkIconButton';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import TitleWithLine from '#ui/TitleWithLine';
import type { SocialLinkItem } from '@azzapp/shared/socialLinkHelpers';
import type { ViewProps, StyleProp, ViewStyle } from 'react-native';
import type {
  SortableGridDragEndCallback,
  SortableGridRenderItem,
} from 'react-native-sortables';

type SocialLinksLinksEditionPanelProps = ViewProps & {
  /**
   * The links currently set on the module
   */
  initialLinks: SocialLinkItem[];
  /**
   * A callback called when the user update the links
   */
  onChangeLinks: (links: SocialLinkItem[]) => void;
  onItemPress: (link: SocialLinkItem) => void;
  onAddLink: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  ignoreKeyboard?: boolean;
  showTitleWithLineHeader?: boolean;
  maxLink?: number;
};

const ITEM_HEIGHT = 90;

/**
 * A Panel to edit the Links of the SocialLinks edition screen
 */
const SocialLinksLinksEditionPanel = ({
  initialLinks,
  onChangeLinks,
  onAddLink,
  onItemPress,
  style,
  contentContainerStyle,
  ignoreKeyboard,
  showTitleWithLineHeader,
  maxLink = -1,
  ...props
}: SocialLinksLinksEditionPanelProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);

  const onChangeOrder = useCallback(
    (arr: SocialLinkItem[]) => {
      const orderedList: SocialLinkItem[] = arr.sort(
        (a, b) => a.position - b.position,
      );
      onChangeLinks(orderedList);
    },
    [onChangeLinks],
  );

  const onDragEnd: SortableGridDragEndCallback<SocialLinkItem> = useCallback(
    params => {
      onChangeOrder(
        params.data?.map((item, index) => ({
          link: item.link,
          position: index,
          socialId: item.socialId,
        })),
      );
    },
    [onChangeOrder],
  );

  const [sortableLinks, setSortableLinks] = useState(
    initialLinks.sort((a, b) => a.position - b.position),
  );

  useEffect(() => {
    if (initialLinks.length !== sortableLinks.length) {
      // refresh links locally only when number of link has changed
      // to avoid re-rendering the list when the order is changed
      setSortableLinks(initialLinks.sort((a, b) => a.position - b.position));
    }
  }, [initialLinks, sortableLinks.length]);

  const { bottom } = useScreenInsets();
  const { width: windowWidth } = useScreenDimensions();

  const paddingHorizontal = windowWidth - ITEM_HEIGHT * sortableLinks.length;

  const scrollEnabled = paddingHorizontal < 0;

  const scrollableStyle: ViewStyle = {
    overflow: 'visible',
    paddingBottom: maxLink <= 0 ? 30 : 0,
    paddingTop: maxLink <= 0 ? 30 : 0,
    maxHeight: 172 - bottom,
    paddingStart: paddingHorizontal / 2,
  };

  const onDeleteLink = useCallback(
    (item: SocialLinkItem) => {
      onChangeOrder(sortableLinks.filter(l => l?.position !== item.position));
    },
    [sortableLinks, onChangeOrder],
  );

  const renderItem = useCallback<SortableGridRenderItem<SocialLinkItem>>(
    ({ item }) => {
      return (
        <View style={styles.itemContainer}>
          <SocialLinkIconButton
            item={item}
            onPress={onItemPress}
            showDelete
            onDeletePress={onDeleteLink}
          />
        </View>
      );
    },
    [onDeleteLink, onItemPress, styles.itemContainer],
  );

  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  const autoScrollEnabled = useSharedValue(true);

  const keyExtractor = (item: SocialLinkItem) =>
    `${item.socialId}${item.link}${item.position}`;

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
      <Animated.ScrollView
        horizontal
        style={scrollableStyle}
        ref={scrollableRef}
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
      >
        <Sortable.Grid
          key={sortableLinks.length}
          scrollableRef={scrollableRef}
          rows={1}
          rowHeight={ITEM_HEIGHT}
          data={sortableLinks}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          overDrag="horizontal"
          autoScrollEnabled={autoScrollEnabled}
          autoScrollDirection="horizontal"
          autoScrollSpeed={5}
          onDragEnd={onDragEnd}
          inactiveItemOpacity={0.5}
        />
      </Animated.ScrollView>
      {maxLink > 0 && (
        <Text variant="medium" style={styles.linksPreviewCount}>
          <FormattedMessage
            defaultMessage="{links}/{maxLink} links"
            description="CoverEditorLinksModal - Links count"
            values={{ links: initialLinks.length, maxLink }}
          />
        </Text>
      )}
      <View style={styles.iconContainer}>
        <IconButton
          icon="add"
          onPress={onAddLink}
          disabled={maxLink > 0 && initialLinks.length >= maxLink}
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
  pressableSocialIcon: {
    paddingHorizontal: 5,
  },
  linksPreviewCount: {
    textAlign: 'center',
    color: appearance === 'light' ? colors.grey400 : colors.grey600,
  },
  itemContainer: {
    width: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export const SOCIAL_LINK_PANEL_ITEM_HEIGHT = 56;
