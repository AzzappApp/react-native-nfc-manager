import { pick } from 'lodash';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  graphql,
  useFragment,
  useLazyLoadQuery,
  useMutation,
  usePaginationFragment,
} from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { DEFAULT_CARD_STYLE, type CardStyle } from '@azzapp/shared/cardHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { useModulesData } from '#components/cardModules/ModuleData';
import WebCardPreview from '#components/WebCardPreview';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { CardStyleModal_cardStyles$key } from '@azzapp/relay/artifacts/CardStyleModal_cardStyles.graphql';
import type { CardStyleModal_profile$key } from '@azzapp/relay/artifacts/CardStyleModal_profile.graphql';
import type { CardStyleModalMutation } from '@azzapp/relay/artifacts/CardStyleModalMutation.graphql';
import type { CardStyleModalQuery } from '@azzapp/relay/artifacts/CardStyleModalQuery.graphql';

type CardStyleModalProps = {
  /**
   * Whether the modal is visible.
   */
  visible: boolean;
  /**
   * Callback fired when the modal request to be closed.
   */
  onRequestClose: () => void;
};

type CardStyleItem = CardStyle & {
  id: string;
  label: string | null;
};

/**
 * A modal that allows the user to select a card style.
 */
const CardStyleModal = ({ visible, onRequestClose }: CardStyleModalProps) => {
  const { viewer } = useLazyLoadQuery<CardStyleModalQuery>(
    graphql`
      query CardStyleModalQuery {
        viewer {
          ...CardStyleModal_cardStyles
          profile {
            ...CardStyleModal_profile
            cardStyle {
              borderColor
              borderRadius
              borderWidth
              buttonColor
              buttonRadius
              fontFamily
              fontSize
              gap
              titleFontFamily
              titleFontSize
            }
          }
        }
      }
    `,
    {},
  );
  const intl = useIntl();

  const currentCardStyle = useMemo<CardStyleItem>(
    () => ({
      id: CURRENT_STYLE_ID,
      label: intl.formatMessage({
        defaultMessage: 'Current style',
        description: 'Card style modal current style label',
      }),
      ...(viewer.profile?.cardStyle ?? DEFAULT_CARD_STYLE),
    }),
    [intl, viewer.profile?.cardStyle],
  );

  const [cardStyle, setCardStyle] = useState<CardStyleItem>(currentCardStyle);

  const [commit, isInFlight] = useMutation<CardStyleModalMutation>(graphql`
    mutation CardStyleModalMutation($input: SaveCardStyleInput!) {
      saveCardStyle(input: $input) {
        profile {
          id
          cardStyle {
            borderColor
            borderRadius
            borderWidth
            buttonRadius
            buttonColor
            fontFamily
            fontSize
            gap
            titleFontFamily
            titleFontSize
          }
        }
      }
    }
  `);

  const onCloseInner = useCallback(() => {
    if (!isInFlight) {
      onRequestClose();
    }
  }, [isInFlight, onRequestClose]);

  const applyCardStyle = useCallback(() => {
    commit({
      variables: {
        input: pick(
          cardStyle,
          'borderColor',
          'borderRadius',
          'borderWidth',
          'buttonColor',
          'buttonRadius',
          'fontFamily',
          'fontSize',
          'gap',
          'titleFontFamily',
          'titleFontSize',
        ),
      },
      onCompleted: () => {
        onRequestClose();
      },
    });
  }, [cardStyle, commit, onRequestClose]);

  const insets = useSafeAreaInsets();

  const { height: windowHeight } = useWindowDimensions();
  const topInset = Math.max(insets.top, 16);
  const bottomInset = Math.max(insets.bottom, 16);
  const previewHeight =
    windowHeight -
    topInset -
    HEADER_HEIGHT -
    CARD_STYLE_LIST_HEIGHT -
    bottomInset;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCloseInner}
    >
      <Container
        style={[
          styles.root,
          {
            paddingTop: topInset,
            paddingBottom: bottomInset,
          },
        ]}
      >
        <Header
          leftElement={
            <IconButton
              icon="arrow_down"
              onPress={onCloseInner}
              iconSize={28}
              variant="icon"
            />
          }
          rightElement={
            <HeaderButton
              label={intl.formatMessage({
                defaultMessage: 'Apply',
                description: 'Card style modal apply button label',
              })}
              onPress={applyCardStyle}
              disabled={cardStyle.id === CURRENT_STYLE_ID}
              loading={isInFlight}
            />
          }
          middleElement={intl.formatMessage({
            defaultMessage: 'Apply a style',
            description: 'Card style modal title',
          })}
        />
        <Suspense
          fallback={
            <View style={styles.activityIndicatorContainer}>
              <ActivityIndicator />
            </View>
          }
        >
          {visible && viewer.profile && (
            <CardStylePreview
              height={previewHeight}
              profile={viewer.profile}
              cardStyle={cardStyle}
            />
          )}
          <CardStyleList
            viewer={viewer}
            currentCardStyle={currentCardStyle}
            selectedCardStyle={cardStyle}
            onSelectCardStyle={setCardStyle}
          />
        </Suspense>
      </Container>
    </Modal>
  );
};

type CardStylePreviewProps = {
  profile: CardStyleModal_profile$key;
  cardStyle: CardStyle;
  height: number;
};

const CardStylePreview = ({
  profile: profileKey,
  cardStyle,
  height,
}: CardStylePreviewProps) => {
  const profile = useFragment(
    graphql`
      fragment CardStyleModal_profile on Profile {
        id
        ...CoverRenderer_profile
        ...WebCardBackground_profile
        cardModules {
          id
          kind
          visible
          ...ModuleData_cardModules
        }
        cardColors {
          primary
          dark
          light
        }
      }
    `,
    profileKey as CardStyleModal_profile$key | null,
  );

  const cardModules = useModulesData(profile?.cardModules ?? []);
  const visibileCardModules = useMemo(
    () => cardModules.filter(module => module.visible),
    [cardModules],
  );

  const { width: windowWidth } = useWindowDimensions();

  if (!profile) {
    return null;
  }

  return (
    <WebCardPreview
      profile={profile}
      contentOffset={{
        x: 0,
        y: windowWidth / COVER_RATIO / 2,
      }}
      height={height}
      cardStyle={cardStyle}
      cardColors={profile.cardColors}
      style={{ flex: 1 }}
      cardModules={visibileCardModules}
    />
  );
};

export default CardStyleModal;

type CardStyleListProps = {
  currentCardStyle: CardStyleItem;
  selectedCardStyle: CardStyleItem;
  onSelectCardStyle: (cardStyle: CardStyleItem) => void;
  viewer: CardStyleModal_cardStyles$key;
};

const CardStyleList = ({
  viewer,
  currentCardStyle,
  selectedCardStyle,
  onSelectCardStyle,
}: CardStyleListProps) => {
  const {
    data: { cardStyles },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment CardStyleModal_cardStyles on Viewer
      @refetchable(queryName: "CardStyleModal_cardStyles_Query")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 20 }
      ) {
        cardStyles(first: $first, after: $after)
          @connection(key: "CardStyleModal_connection_cardStyles") {
          edges {
            node {
              id
              label
              borderColor
              borderRadius
              borderWidth
              buttonColor
              buttonRadius
              fontFamily
              fontSize
              gap
              titleFontFamily
              titleFontSize
            }
          }
        }
      }
    `,
    viewer as CardStyleModal_cardStyles$key,
  );

  const cardStylesItems = useMemo<CardStyleItem[]>(
    () => [
      currentCardStyle,
      ...convertToNonNullArray(
        cardStyles.edges?.map(edge => edge?.node ?? null) ?? [],
      ),
    ],
    [cardStyles.edges, currentCardStyle],
  );

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  const renderCarStyle = useCallback(
    ({ item }: { item: CardStyleItem }) => (
      <PressableNative
        onPress={() => onSelectCardStyle(item)}
        style={styles.cardStyleItem}
      >
        <Text
          style={[
            styles.cardStyleItemLabel,
            { fontFamily: item.titleFontFamily },
            selectedCardStyle.id !== item.id && { opacity: 0.5, fontSize: 16 },
          ]}
        >
          {item.label}
        </Text>
      </PressableNative>
    ),
    [onSelectCardStyle, selectedCardStyle.id],
  );

  return (
    <FlatList
      data={cardStylesItems}
      renderItem={renderCarStyle}
      keyExtractor={keyExtractor}
      onEndReached={onEndReached}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.cardStyleList}
      contentContainerStyle={styles.cardStyleListContainer}
    />
  );
};

const keyExtractor = (item: CardStyleItem) => item.id;

const CURRENT_STYLE_ID = 'CURRENT_STYLE_ID';

const CARD_STYLE_LIST_HEIGHT = 90;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 200,
  },
  cardStyleList: {
    height: CARD_STYLE_LIST_HEIGHT,
    borderTopColor: colors.grey100,
    borderTopWidth: 1,
  },
  cardStyleListContainer: {
    paddingHorizontal: 20,
    gap: 30,
  },
  cardStyleItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStyleItemLabel: {
    fontSize: 22,
  },
});
