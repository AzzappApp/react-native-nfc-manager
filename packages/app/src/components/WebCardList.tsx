import { memo, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { FlatList, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { keyExtractor } from '#helpers/idHelpers';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import CoverLink from './CoverLink';
import Link from './Link';
import type {
  WebCardList_webCard$data,
  WebCardList_webCard$key,
} from '#relayArtifacts/WebCardList_webCard.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ColorSchemeName, StyleProp, ViewStyle } from 'react-native';

const WebCardListItemMemoized = memo(function ProfileListItem({
  webCard,
  onToggleFollow,
}: {
  onToggleFollow?: (id: string, userName: string) => void;
  webCard: ArrayItemType<WebCardList_webCard$data>;
}) {
  const styles = useStyleSheet(styleSheet);

  const toggleFollow =
    webCard.userName && onToggleFollow
      ? () => {
          if (webCard.userName) onToggleFollow(webCard.id, webCard.userName);
        }
      : undefined;

  return (
    // TODO reenable once RANIMATED3 see: https://github.com/software-mansion/react-native-reanimated/issues/3124
    <Animated.View style={styles.item} /*exiting={FadeOutUp}*/>
      <Link
        route="WEBCARD"
        disabled={webCard.cardIsPublished === false}
        params={{ webCardId: webCard.id }}
      >
        <PressableNative style={styles.profile}>
          <CoverLink webCard={webCard} width={COVER_WIDTH} canPlay={false} />
          <View>
            <Text variant="large" numberOfLines={1}>
              {webCard.userName}
            </Text>
            {webCard.cardIsPublished === false && (
              <Text variant="small">
                <FormattedMessage
                  defaultMessage="Unpublished"
                  description="WebCardList - webcard unpublished information"
                />
              </Text>
            )}
          </View>
        </PressableNative>
      </Link>
      {onToggleFollow && webCard.userName ? (
        <IconButton
          icon="delete"
          size={35}
          style={styles.deleteIconButton}
          iconStyle={styles.deleteIcon}
          onPress={toggleFollow}
        />
      ) : null}
    </Animated.View>
  );
});

type ProfileListProps = {
  users: WebCardList_webCard$key;
  onEndReached?: () => void;
  style?: StyleProp<ViewStyle>;
  onToggleFollow?: (id: string, userName: string) => void;
  ListEmptyComponent: JSX.Element;
};

const COVER_WIDTH = 35;
const COVER_HEIGHT = 56;

const SEPARATOR_HEIGHT = 10.5;

const getItemLayout = (_data: any, index: number) => ({
  length: COVER_HEIGHT,
  offset: COVER_HEIGHT * index + SEPARATOR_HEIGHT * (index - 1),
  index,
});

const WebCardList = ({
  users: usersKey,
  onEndReached,
  style,
  onToggleFollow,
  ListEmptyComponent,
}: ProfileListProps) => {
  const users = useFragment(
    graphql`
      fragment WebCardList_webCard on WebCard @relay(plural: true) {
        id
        userName
        cardIsPublished
        ...CoverLink_webCard
      }
    `,
    usersKey,
  );

  const renderItem = useCallback(
    ({ item }: { item: ArrayItemType<WebCardList_webCard$data> }) => (
      <WebCardListItemMemoized webCard={item} onToggleFollow={onToggleFollow} />
    ),
    [onToggleFollow],
  );

  const styles = useStyleSheet(styleSheet);

  return (
    <FlatList
      testID="webCard-list"
      accessibilityRole="list"
      data={users}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={style}
      getItemLayout={getItemLayout}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={<View style={styles.footer} />}
    />
  );
};

export default WebCardList;

const styleSheet = createStyleSheet((appareance: ColorSchemeName) => ({
  container: {
    flexGrow: 1,
    rowGap: SEPARATOR_HEIGHT,
  },

  item: {
    paddingRight: 10,
    columnGap: 15.5,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  profile: {
    paddingLeft: 20.5,
    columnGap: 15.5,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deleteIconButton: {
    marginLeft: 'auto',
  },
  deleteIcon: {
    tintColor: appareance === 'dark' ? '#fff' : '#000',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    height: 10,
    width: '100%',
  },
}));
