import pick from 'lodash/pick';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { View, useWindowDimensions } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
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
import { ScreenModal } from '#components/NativeRouter';
import WebCardPreview from '#components/WebCardPreview';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { keyExtractor } from '#helpers/idHelpers';
import { useProfileInfos } from '#hooks/authStateHooks';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ModalDismissRequestEvent } from '#components/NativeRouter';
import type { CardStyleModal_CardStyleList_profile$key } from '#relayArtifacts/CardStyleModal_CardStyleList_profile.graphql';
import type { CardStyleModal_webCard$key } from '#relayArtifacts/CardStyleModal_webCard.graphql';
import type { CardStyleModalMutation } from '#relayArtifacts/CardStyleModalMutation.graphql';
import type { CardStyleModalQuery } from '#relayArtifacts/CardStyleModalQuery.graphql';

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
  const profileInfos = useProfileInfos();
  const { profile } = useLazyLoadQuery<CardStyleModalQuery>(
    graphql`
      query CardStyleModalQuery($profileId: ID!) {
        profile: node(id: $profileId) {
          ... on Profile {
            webCard {
              id
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
              ...CardStyleModal_webCard
            }
            ...CardStyleModal_CardStyleList_profile
          }
        }
      }
    `,
    {
      profileId: profileInfos?.profileId ?? '',
    },
  );
  const intl = useIntl();

  const styles = useStyleSheet(styleSheet);

  const currentCardStyle = useMemo<CardStyleItem>(
    () => ({
      id: CURRENT_STYLE_ID,
      label: intl.formatMessage({
        defaultMessage: 'Current style',
        description: 'Card style modal current style label',
      }),
      ...(profile?.webCard?.cardStyle ?? DEFAULT_CARD_STYLE),
    }),
    [intl, profile?.webCard?.cardStyle],
  );

  const [cardStyle, setCardStyle] = useState<CardStyleItem>(currentCardStyle);

  const [commit, isInFlight] = useMutation<CardStyleModalMutation>(graphql`
    mutation CardStyleModalMutation(
      $webCardId: ID!
      $input: SaveCardStyleInput!
    ) {
      saveCardStyle(webCardId: $webCardId, input: $input) {
        webCard {
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

  const onRequestDismiss = useCallback(
    (event: ModalDismissRequestEvent) => {
      if (isInFlight) {
        event.preventModalDismiss();
        return;
      }
      onRequestClose();
    },
    [isInFlight, onRequestClose],
  );

  const applyCardStyle = useCallback(() => {
    commit({
      variables: {
        webCardId: profile?.webCard?.id ?? '',
        input: {
          ...pick(
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
      },
      onCompleted: () => {
        onRequestClose();
      },
      onError: error => {
        console.error(error);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Error, could not apply the style',
            description: 'Card style modal error toast',
          }),
        });
      },
    });
  }, [cardStyle, commit, intl, onRequestClose, profile?.webCard?.id]);

  const insets = useScreenInsets();
  const { height: windowHeight } = useWindowDimensions();

  const previewHeight =
    windowHeight -
    insets.top -
    HEADER_HEIGHT -
    CARD_STYLE_LIST_HEIGHT -
    CARD_STYLE_BORDER_HEIGHT -
    insets.bottom;

  return (
    <ScreenModal
      visible={visible}
      animationType="slide"
      onRequestDismiss={onRequestDismiss}
      gestureEnabled={!isInFlight}
    >
      <Container
        style={[
          styles.root,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
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
          {visible && profile?.webCard && (
            <CardStylePreview
              height={previewHeight}
              webCard={profile.webCard}
              cardStyle={cardStyle}
            />
          )}
          {profile && (
            <CardStyleList
              profile={profile}
              currentCardStyle={currentCardStyle}
              selectedCardStyle={cardStyle}
              onSelectCardStyle={setCardStyle}
            />
          )}
        </Suspense>
      </Container>
    </ScreenModal>
  );
};

type CardStylePreviewProps = {
  webCard: CardStyleModal_webCard$key;
  cardStyle: CardStyle;
  height: number;
};

const CardStylePreview = ({
  webCard: webCardKey,
  cardStyle,
  height,
}: CardStylePreviewProps) => {
  const webCard = useFragment(
    graphql`
      fragment CardStyleModal_webCard on WebCard {
        id
        ...WebCardPreview_webCard
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
    webCardKey as CardStyleModal_webCard$key | null,
  );

  const cardModules = useModulesData(webCard?.cardModules ?? [], true);

  const { width: windowWidth } = useWindowDimensions();

  if (!webCard) {
    return null;
  }

  return (
    <WebCardPreview
      webCard={webCard}
      contentOffset={{
        x: 0,
        y: windowWidth / COVER_RATIO / 2,
      }}
      height={height}
      cardStyle={cardStyle}
      cardColors={webCard.cardColors}
      style={{ flex: 1 }}
      cardModules={cardModules}
    />
  );
};

export default CardStyleModal;

type CardStyleListProps = {
  currentCardStyle: CardStyleItem;
  selectedCardStyle: CardStyleItem;
  onSelectCardStyle: (cardStyle: CardStyleItem) => void;
  profile: CardStyleModal_CardStyleList_profile$key;
};

const CardStyleList = ({
  profile,
  currentCardStyle,
  selectedCardStyle,
  onSelectCardStyle,
}: CardStyleListProps) => {
  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();

  const {
    data: { cardStyles },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment CardStyleModal_CardStyleList_profile on Profile
      @refetchable(queryName: "CardStyleModal_CardStyleList_profile_Query")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 20 }
      ) {
        cardStyles(first: $first, after: $after)
          @connection(
            key: "CardStyleModal_CardStyleList_connection_cardStyles"
          ) {
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
    profile as CardStyleModal_CardStyleList_profile$key,
  );

  const cardStylesItems = useMemo<CardStyleItem[]>(
    () => [
      currentCardStyle,
      ...convertToNonNullArray(
        cardStyles?.edges?.map(edge => edge?.node ?? null) ?? [],
      ),
    ],
    [cardStyles?.edges, currentCardStyle],
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
          {item.label ||
            intl.formatMessage({
              defaultMessage: 'Style',
              description:
                'default style label in style list (fallback when no label available)',
            })}
        </Text>
      </PressableNative>
    ),
    [
      intl,
      onSelectCardStyle,
      selectedCardStyle.id,
      styles.cardStyleItem,
      styles.cardStyleItemLabel,
    ],
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

const CURRENT_STYLE_ID = 'CURRENT_STYLE_ID';

const CARD_STYLE_LIST_HEIGHT = 90;

const CARD_STYLE_BORDER_HEIGHT = 1;

const styleSheet = createStyleSheet(appearance => ({
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
    borderTopColor: appearance === 'dark' ? colors.grey900 : colors.grey100,
    borderTopWidth: CARD_STYLE_BORDER_HEIGHT,
    backgroundColor: appearance === 'dark' ? colors.black : colors.white,
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
}));
