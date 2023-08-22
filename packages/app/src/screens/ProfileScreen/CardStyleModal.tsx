import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  graphql,
  useFragment,
  useLazyLoadQuery,
  useMutation,
  usePaginationFragment,
} from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import WebCardList from '#components/WebCardList';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button, { BUTTON_HEIGHT } from '#ui/Button';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { WebCardInfo } from '#components/WebCardList';
import type { ModuleInfo } from '#components/WebCardRenderer';
import type { CardStyleModal_cardStyles$key } from '@azzapp/relay/artifacts/CardStyleModal_cardStyles.graphql';
import type { CardStyleModal_profile$key } from '@azzapp/relay/artifacts/CardStyleModal_profile.graphql';
import type { CardStyleModal_viewer$key } from '@azzapp/relay/artifacts/CardStyleModal_viewer.graphql';
import type { CardStyleModalQuery } from '@azzapp/relay/artifacts/CardStyleModalQuery.graphql';
import type { CardStyle } from '@azzapp/shared/cardHelpers';

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

/**
 * A modal that allows the user to select a card style.
 */
const CardStyleModal = ({ visible, onRequestClose }: CardStyleModalProps) => {
  const intl = useIntl();

  const [cardStyle, setCardStyle] = useState<CardStyle | null>(null);

  const { viewer } = useLazyLoadQuery<CardStyleModalQuery>(
    graphql`
      query CardStyleModalQuery {
        viewer {
          ...CardStyleModal_viewer
        }
      }
    `,
    {},
  );

  const [commit, isInFlight] = useMutation(graphql`
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
        input: {
          ...cardStyle,
        },
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
  const listHeight =
    windowHeight -
    HEADER_HEIGHT -
    2 * GAP -
    BUTTON_HEIGHT -
    topInset -
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
          {visible && (
            <CardStyleList
              height={listHeight}
              viewer={viewer}
              onSelectedCardStyleChange={setCardStyle}
            />
          )}
        </Suspense>
        <Button
          variant="primary"
          style={styles.saveButton}
          label={intl.formatMessage({
            defaultMessage: 'Apply this style',
            description: 'Card style modal apply button',
          })}
          onPress={applyCardStyle}
          loading={isInFlight}
          disabled={!cardStyle}
        />
      </Container>
    </Modal>
  );
};

type CardStyleListProps = {
  viewer: CardStyleModal_viewer$key;
  height: number;
  onSelectedCardStyleChange: (style: CardStyle) => void;
};

const CardStyleList = ({
  viewer: viewerKey,
  height,
  onSelectedCardStyleChange,
}: CardStyleListProps) => {
  const viewer = useFragment(
    graphql`
      fragment CardStyleModal_viewer on Viewer {
        ...CardStyleModal_cardStyles
        profile {
          ...CardStyleModal_profile
        }
      }
    `,
    viewerKey,
  );

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
          ...HorizontalPhotoRenderer_module
          ...SimpleTextRenderer_module
          ...LineDividerRenderer_module
          ...CarouselRenderer_module
          ...SimpleButtonRenderer_module
          ...PhotoWithTextAndTitleRenderer_module
          ...SocialLinksRenderer_module
          ...BlockTextRenderer_module
        }
        cardColors {
          primary
          dark
          light
        }
      }
    `,
    viewer.profile as CardStyleModal_profile$key | null,
  );

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

  const cardModules: ModuleInfo[] = useMemo(
    () =>
      convertToNonNullArray(
        profile?.cardModules?.map(module =>
          module.visible
            ? ({
                kind: module.kind,
                key: module,
              } as ModuleInfo)
            : null,
        ) ?? [],
      ),
    [profile?.cardModules],
  );

  const cards: WebCardInfo[] = useMemo(
    () =>
      convertToNonNullArray(
        cardStyles.edges?.map(edge => {
          if (!edge?.node) {
            return null;
          }
          const {
            id,
            label,
            borderColor,
            borderRadius,
            borderWidth,
            buttonColor,
            buttonRadius,
            fontFamily,
            fontSize,
            gap,
            titleFontFamily,
            titleFontSize,
          } = edge.node;

          return {
            id,
            label: label ?? '',
            profile: profile!,
            cardStyle: {
              borderColor,
              borderRadius,
              borderWidth,
              buttonColor,
              buttonRadius,
              fontFamily,
              fontSize,
              gap,
              titleFontFamily,
              titleFontSize,
            },
            cardModules,
            cardColors: profile?.cardColors,
          };
        }) ?? [],
      ),
    [cardModules, cardStyles.edges, profile],
  );

  const onSelectedIndexChange = useCallback(
    (index: number) => {
      const cardStyle = cards[index]?.cardStyle;
      if (!cardStyle) {
        return;
      }
      onSelectedCardStyleChange(cardStyle);
    },
    [onSelectedCardStyleChange, cards],
  );

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  useEffect(() => {
    if (cards.length > 0) {
      onSelectedIndexChange(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile) {
    return null;
  }

  return (
    <WebCardList
      cards={cards}
      height={height}
      initialWebCardScrollPosition="halfCover"
      onSelectedIndexChange={onSelectedIndexChange}
      onEndReached={onEndReached}
      style={styles.cardStyleList}
    />
  );
};

export default CardStyleModal;

const GAP = 20;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: GAP,
  },
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 200,
  },
  saveButton: {
    marginHorizontal: 25,
  },
  cardStyleList: {
    flex: 1,
  },
});
