import { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  View,
  FlatList,
  useWindowDimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useLazyLoadQuery, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  DEFAULT_COLOR_PALETTE,
  type CardStyle,
  type ColorPalette,
} from '@azzapp/shared/cardHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Button, { BUTTON_HEIGHT } from '#ui/Button';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import { useModulesData } from './cardModules/ModuleData';
import { CancelHeaderButton } from './commonsButtons';
import WebCardPreview from './WebCardPreview';
import type { CardTemplateList_cardTemplates$key } from '@azzapp/relay/artifacts/CardTemplateList_cardTemplates.graphql';
import type { CardTemplateListQuery } from '@azzapp/relay/artifacts/CardTemplateListQuery.graphql';
import type { CoverRenderer_profile$key } from '@azzapp/relay/artifacts/CoverRenderer_profile.graphql';
import type { ModuleData_cardModules$key } from '@azzapp/relay/artifacts/ModuleData_cardModules.graphql';
import type { WebCardBackground_profile$key } from '@azzapp/relay/artifacts/WebCardBackground_profile.graphql';
import type { ReactNode } from 'react';
import type {
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type CardTemplateListProps = Omit<ViewProps, 'children'> & {
  height: number;
  onApplyTemplate: (cardTemplateId: string) => void;
  onSkip?: () => void;
  loading: boolean;
  children?: ReactNode;
  onPreviewModal?: () => void;
  onPreviewModalClose?: () => void;
  previewModalStyle?: ViewProps['style'];
};

const CardTemplateList = ({
  height,
  onApplyTemplate,
  onSkip,
  loading,
  style,
  previewModalStyle,
  onPreviewModal,
  onPreviewModalClose,
  ...props
}: CardTemplateListProps) => {
  const { viewer } = useLazyLoadQuery<CardTemplateListQuery>(
    graphql`
      query CardTemplateListQuery {
        viewer {
          ...CardTemplateList_cardTemplates
          profile {
            id
            ...CoverRenderer_profile
            ...WebCardBackground_profile
            cardColors {
              primary
              dark
              light
            }
          }
        }
      }
    `,
    {},
  );

  const { profile } = viewer;

  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    graphql`
      fragment CardTemplateList_cardTemplates on Viewer
      @refetchable(queryName: "CardTemplateList_cardTemplates_Query")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 20 }
      ) {
        cardTemplates(first: $first, after: $after)
          @connection(key: "CardTemplateList_connection_cardTemplates") {
          edges {
            node {
              id
              label
              previewMedia {
                uri(width: 1024)
                aspectRatio
              }
              cardStyle {
                borderColor
                borderRadius
                borderWidth
                buttonColor
                fontFamily
                fontSize
                gap
                titleFontFamily
                titleFontSize
                buttonRadius
              }
              modules {
                ...ModuleData_cardModules
              }
            }
          }
        }
      }
    `,
    viewer as CardTemplateList_cardTemplates$key,
  );

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  const { width: windowWidth } = useWindowDimensions();
  const itemWidth = windowWidth - 100;

  const selectedIndexRef = useRef(0);
  const onScroll = useCallback(
    ({
      nativeEvent: { contentOffset },
    }: NativeSyntheticEvent<NativeScrollEvent>) => {
      selectedIndexRef.current = Math.round(
        contentOffset.x / (itemWidth + GAP),
      );
    },
    [itemWidth],
  );

  const templates = useMemo<CardTemplateItem[]>(
    () =>
      convertToNonNullArray(
        data?.cardTemplates?.edges?.map(edge => {
          if (!edge?.node || !profile) {
            return null;
          }
          const { id, previewMedia, label, cardStyle, modules } = edge.node;
          return {
            id,
            previewMedia,
            label,
            cardStyle,
            modules,
          };
        }) ?? [],
      ),
    [data?.cardTemplates?.edges, profile],
  );

  const onSubmit = () => {
    if (!templates) {
      return;
    }

    onApplyTemplate(templates[selectedIndexRef.current].id);
  };

  const [previewTemplate, setPreviewTemplate] =
    useState<CardTemplateItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const onPreview = useCallback(() => {
    const template = templates[selectedIndexRef.current];
    if (!template) {
      return;
    }
    setPreviewTemplate(template);
    setShowPreviewModal(true);
    onPreviewModal?.();
  }, [onPreviewModal, templates]);

  const onClosePreviewModal = useCallback(() => {
    setShowPreviewModal(false);
    onPreviewModalClose?.();
  }, [onPreviewModalClose]);

  const onApplyPreviewTemplate = useCallback(() => {
    if (!previewTemplate) {
      return;
    }
    onApplyTemplate(previewTemplate.id);
  }, [onApplyTemplate, previewTemplate]);

  const styles = useStyleSheet(stylesheet);
  const canSkip = !!onSkip;

  const maxScrollViewHeight =
    height -
    LABEL_CONTAINER_HEIGHT -
    GAP -
    BUTTON_HEIGHT * 2 -
    BUTTON_GAP -
    (canSkip ? SKIP_BUTTON_HEIGHT + BUTTON_GAP : 0);

  const intl = useIntl();

  const renderItem = useCallback<ListRenderItem<CardTemplateItem>>(
    ({ item }) => {
      const imageHeight = item.previewMedia
        ? itemWidth / item.previewMedia.aspectRatio
        : null;
      return (
        <View
          style={{
            width: itemWidth,
            overflow: 'visible',
          }}
        >
          <View style={styles.labelContainerHeight}>
            <Text variant="smallbold">{item.label}</Text>
          </View>
          <View
            style={[
              styles.webCardContainer,
              { maxHeight: maxScrollViewHeight },
              imageHeight != null && { height: imageHeight },
            ]}
          >
            <ScrollView
              style={[styles.webCardContainerRadius, { flex: 1 }]}
              contentContainerStyle={
                imageHeight != null ? { height: imageHeight } : null
              }
            >
              {item.previewMedia && (
                <Image
                  source={{ uri: item.previewMedia.uri }}
                  style={{
                    width: itemWidth,
                    height: imageHeight!,
                  }}
                />
              )}
            </ScrollView>
          </View>
        </View>
      );
    },
    [
      itemWidth,
      styles.labelContainerHeight,
      styles.webCardContainer,
      styles.webCardContainerRadius,
      maxScrollViewHeight,
    ],
  );

  return (
    <>
      <View style={[styles.root, style]} {...props}>
        <View style={{ flex: 1 }}>
          {templates && (
            <FlatList
              data={templates}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              onScroll={onScroll}
              onEndReached={onEndReached}
              style={[styles.cardTemplateList]}
              contentContainerStyle={styles.cardTemplateListContentContainer}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={windowWidth - 100 + GAP}
              snapToAlignment="start"
              decelerationRate="fast"
              scrollEventThrottle={16}
              nestedScrollEnabled
            />
          )}
        </View>
        <View style={styles.buttons}>
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Preview',
              description: 'label of the button allowing to preview template',
            })}
            onPress={onPreview}
            variant="secondary"
          />
          <Button
            onPress={onSubmit}
            label={intl.formatMessage({
              defaultMessage: 'Load this template',
              description:
                'label of the button allowing to retry loading card template',
            })}
            loading={loading}
          />
          {canSkip && (
            <PressableNative
              onPress={onSkip}
              style={styles.skipButton}
              disabled={loading}
            >
              <Text style={styles.skip}>
                {intl.formatMessage({
                  defaultMessage: 'Skip',
                  description:
                    'label of the button allowing to skil loading card template',
                })}
              </Text>
            </PressableNative>
          )}
        </View>
      </View>
      <CardTemplatePreviewModal
        visible={showPreviewModal}
        onRequestClose={onClosePreviewModal}
        onApply={onApplyPreviewTemplate}
        template={previewTemplate}
        profile={profile}
        cardColors={profile?.cardColors ?? DEFAULT_COLOR_PALETTE}
        loading={loading}
        style={previewModalStyle}
      />
    </>
  );
};
export default CardTemplateList;

type CardTemplateItem = {
  id: string;
  previewMedia: { uri: string; aspectRatio: number } | null;
  label: string | null;
  cardStyle: CardStyle;
  modules: ModuleData_cardModules$key;
};

type CoverTemplatePreviewModalProps = {
  visible: boolean;
  profile: (CoverRenderer_profile$key & WebCardBackground_profile$key) | null;
  template: CardTemplateItem | null;
  cardColors: ColorPalette;
  loading: boolean;
  style?: ViewProps['style'];
  onApply: () => void;
  onRequestClose: () => void;
};

const CardTemplatePreviewModal = ({
  visible,
  profile,
  template,
  cardColors,
  loading,
  style,
  onApply,
  onRequestClose,
}: CoverTemplatePreviewModalProps) => {
  const cardModules = useModulesData(template?.modules ?? []);

  const intl = useIntl();

  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 16);
  const bottomInset = Math.max(insets.bottom, 16);

  const previewHeight = windowHeight - topInset - HEADER_HEIGHT;

  if (!visible) {
    return null;
  }
  return (
    <View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          height: windowHeight,
          width: windowWidth,
          zIndex: 100,
        },
        style,
      ]}
    >
      <Container style={{ flex: 1, paddingTop: topInset }}>
        <Header
          leftElement={<CancelHeaderButton onPress={onRequestClose} />}
          middleElement={template?.label ?? ''}
          rightElement={
            <HeaderButton
              onPress={onApply}
              label={intl.formatMessage({
                defaultMessage: 'Apply',
                description: 'Apply button label in card template preview',
              })}
              loading={loading}
            />
          }
        />
        {template && profile && (
          <WebCardPreview
            profile={profile}
            height={previewHeight}
            cardStyle={template.cardStyle}
            cardColors={cardColors}
            style={{ flex: 1 }}
            cardModules={cardModules}
            contentPaddingBottom={bottomInset}
          />
        )}
      </Container>
    </View>
  );
};

const keyExtractor = (item: { id: string }) => item.id;

const GAP = 20;
const ITEM_RADIUS = 20;
const BUTTON_GAP = 10;
const SKIP_BUTTON_HEIGHT = 18;
const LABEL_CONTAINER_HEIGHT = 55;

const stylesheet = createStyleSheet(theme => ({
  root: {
    flex: 1,
    gap: GAP,
  },
  cardTemplateList: {
    flex: 1,
    overflow: 'visible',
  },
  cardTemplateListContentContainer: {
    paddingHorizontal: 50,
    gap: GAP,
    overflow: 'visible',
  },
  buttons: {
    paddingHorizontal: 25,
    gap: BUTTON_GAP,
  },
  skipButton: {
    height: SKIP_BUTTON_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skip: {
    color: colors.grey200,
  },
  labelContainerHeight: {
    height: LABEL_CONTAINER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webCardContainer: [
    {
      backgroundColor: colors.grey100,
      borderRadius: ITEM_RADIUS,
      minHeight: '30%',
    },
    shadow(theme, 'bottom'),
  ],
  webCardContainerRadius: {
    borderRadius: ITEM_RADIUS,
    overflow: 'hidden',
    flex: 1,
  },
  webCardList: {
    flex: 1,
  },
}));
