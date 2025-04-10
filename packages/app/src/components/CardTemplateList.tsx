import { Image } from 'expo-image';
import { fromGlobalId } from 'graphql-relay';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import {
  View,
  FlatList,
  useWindowDimensions,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { graphql, useLazyLoadQuery, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { keyExtractor } from '#helpers/idHelpers';
import useScreenInsets from '#hooks/useScreenInsets';
import Button, { BUTTON_HEIGHT } from '#ui/Button';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import SearchBarStatic from '#ui/SearchBarStatic';
import SelectSection from '#ui/SelectSection';
import Text from '#ui/Text';
import { useModulesData } from './cardModules/ModuleData';
import { CancelHeaderButton } from './commonsButtons';
import PremiumIndicator from './PremiumIndicator';
import WebCardPreview from './WebCardPreview';
import type {
  CardTemplateList_cardTemplates$data,
  CardTemplateList_cardTemplates$key,
} from '#relayArtifacts/CardTemplateList_cardTemplates.graphql';
import type { CardTemplateListQuery } from '#relayArtifacts/CardTemplateListQuery.graphql';
import type { WebCardPreview_webCard$key } from '#relayArtifacts/WebCardPreview_webCard.graphql';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ForwardedRef, ReactNode } from 'react';
import type {
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewProps,
} from 'react-native';

type CardTemplateListProps = Omit<ViewProps, 'children'> & {
  profileId: string;
  height: number;
  onApplyTemplate: (cardTemplate: CardTemplateItem) => void;
  onSkip?: () => void;
  loading: boolean;
  children?: ReactNode;
  onPreviewModal?: () => void;
  onPreviewModalClose?: () => void;
  onSelectTemplate?: (template: CardTemplateItem) => void;
};

export type CardTemplateListHandle = {
  onSubmit: () => void;
};

const CardTemplateList = (
  {
    profileId,
    height,
    onApplyTemplate,
    onSkip,
    loading,
    style,
    onPreviewModal,
    onPreviewModalClose,
    onSelectTemplate,
    ...props
  }: CardTemplateListProps,
  forwardRef: ForwardedRef<CardTemplateListHandle>,
) => {
  const { node } = useLazyLoadQuery<CardTemplateListQuery>(
    graphql`
      query CardTemplateListQuery($profileId: ID!) {
        node(id: $profileId) {
          ... on Profile @alias(as: "profile") {
            ...CardTemplateList_cardTemplates
            cardTemplateTypes {
              id
              label
            }
            webCard {
              id
              ...WebCardPreview_webCard
              cardColors {
                primary
                dark
                light
              }
              isPremium
            }
          }
        }
      }
    `,
    { profileId },
  );

  const profile = node?.profile;
  const isPremium = node?.profile?.webCard?.isPremium;
  const cardTemplateTypes = profile?.cardTemplateTypes;

  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment CardTemplateList_cardTemplates on Profile
        @refetchable(queryName: "CardTemplateList_cardTemplates_Query")
        @argumentDefinitions(
          cardTemplateTypeId: { type: String, defaultValue: null }
          after: { type: String }
          first: { type: Int, defaultValue: 20 }
        ) {
          cardTemplates(
            cardTemplateTypeId: $cardTemplateTypeId
            first: $first
            after: $after
          ) @connection(key: "CardTemplateList_connection_cardTemplates") {
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
                cardTemplateType {
                  id
                  label
                }
                modules {
                  kind
                  ...ModuleData_cardModules
                }
              }
            }
          }
        }
      `,
      profile as CardTemplateList_cardTemplates$key | null,
    );

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  const { width: windowWidth } = useWindowDimensions();
  const { bottom } = useScreenInsets();
  const itemWidth = windowWidth - 100;

  const selectedIndexRef = useRef(0);

  const templates = useMemo<CardTemplateItem[]>(
    () =>
      convertToNonNullArray(
        data?.cardTemplates?.edges?.map(edge => {
          if (!edge?.node || !profile) {
            return null;
          }
          const {
            id,
            previewMedia,
            label,
            cardStyle,
            modules,
            cardTemplateType,
          } = edge.node;
          return {
            id,
            previewMedia,
            label,
            cardStyle,
            modules,
            cardTemplateType,
          };
        }) ?? [],
      ).sort((a, b) => (a.label ?? '').localeCompare(b.label ?? '')),
    [data?.cardTemplates?.edges, profile],
  );

  useEffect(() => {
    onSelectTemplate?.(templates[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = useCallback(
    ({
      nativeEvent: { contentOffset },
    }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const templateIndex = Math.round(contentOffset.x / (itemWidth + GAP));
      selectedIndexRef.current = templateIndex;
      onSelectTemplate?.(templates[templateIndex]);
    },
    [itemWidth, onSelectTemplate, templates],
  );

  useImperativeHandle(forwardRef, () => ({
    onSubmit: () => {
      if (!templates) {
        return;
      }
      onApplyTemplate(templates[selectedIndexRef.current]);
    },
  }));

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
    onApplyTemplate(previewTemplate);
  }, [onApplyTemplate, previewTemplate]);

  const styles = useStyleSheet(stylesheet);
  const canSkip = !!onSkip;

  const maxScrollViewHeight =
    height -
    LABEL_CONTAINER_HEIGHT -
    GAP -
    BUTTON_HEIGHT * 2 -
    BUTTON_GAP -
    SELECT_INPUT_HEIGHT -
    (canSkip ? SKIP_BUTTON_HEIGHT + BUTTON_GAP : 0);

  const intl = useIntl();

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index + GAP * (index - 1),
      index,
    }),
    [itemWidth],
  );

  const renderItem = useCallback<ListRenderItem<CardTemplateItem>>(
    ({ item, index }) => {
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
              overScrollMode="never"
            >
              <View style={styles.webCardContainerRadius}>
                {item.previewMedia && (
                  <Image
                    source={item.previewMedia}
                    style={{
                      width: itemWidth,
                      height: imageHeight!,
                    }}
                    priority={index === 0 ? 'high' : 'normal'}
                  />
                )}
              </View>
            </ScrollView>
            <PremiumIndicator
              isRequired={item.modules.length > 3 && !isPremium}
              style={{ position: 'absolute', right: 17, top: 9 }}
              size={26}
            />
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
      isPremium,
    ],
  );

  // #region Section List card category
  const sectionKeyExtractor = (item: { id: string }) => {
    return item.id;
  };

  const { top } = useScreenInsets();

  const [selectedCardTemplateType, setSelectedCardTemplateType] = useState<
    { id: string; title: string } | undefined
  >(undefined);

  const [search, setSearch] = useState('');

  const templateTypes = useMemo(() => {
    return (
      cardTemplateTypes?.reduce(
        (
          acc: Array<{
            title: string;
            data: [
              {
                id: string;
                title: string;
                data: Array<{ id: string; title: string } | null>;
              },
            ];
          }>,
          curr,
        ) => {
          if (!curr) {
            return acc;
          }
          const label = curr?.label ?? '-';

          const existingSection = acc.find(section => section.title === label);

          if (existingSection) {
            if (
              !search.trim() ||
              curr.label?.toLowerCase().includes(search.trim().toLowerCase())
            ) {
              existingSection.data.push({
                id: curr.id,
                title: curr.label ?? '-',
                data: [],
              });

              existingSection.data = existingSection.data.sort((a, b) =>
                a.title.localeCompare(b.title),
              );
            }
          } else if (
            !search.trim() ||
            curr.label?.toLowerCase().includes(search.trim().toLowerCase())
          ) {
            acc.push({
              title: label,
              data: [{ id: curr.id, title: curr.label ?? '-', data: [] }],
            });
          }

          return acc;
        },
        [],
      ) ?? []
    ).sort((a, b) => a.title.localeCompare(b.title));
  }, [cardTemplateTypes, search]);

  const onSelectSection = useCallback(
    (item: { id: string; title: string }) => {
      setSelectedCardTemplateType(item);
      refetch(
        { cardTemplateTypeId: fromGlobalId(item.id).id, after: null },
        { fetchPolicy: 'store-and-network' },
      );
    },
    [refetch],
  );

  useEffect(() => {
    if (!selectedCardTemplateType && templates?.length > 0) {
      setSelectedCardTemplateType({
        id: templates[0].cardTemplateType?.id ?? '-',
        title: templates[0].cardTemplateType?.label ?? '-',
      });
    }
  }, [selectedCardTemplateType, templates]);
  // #endregion

  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    if (templates.length > 0) {
      onSelectTemplate?.(templates[0]);
    }
  }, [onSelectTemplate, templates]);

  return (
    <>
      <View style={[styles.root, style]} {...props}>
        <View style={{ flex: 1 }}>
          <SelectSection
            nativeID="activities"
            accessibilityLabelledBy="activitiesLabel"
            sections={templateTypes}
            inputLabel={selectedCardTemplateType?.title}
            selectedItemKey={selectedCardTemplateType?.id}
            keyExtractor={sectionKeyExtractor as any}
            bottomSheetHeight={windowHeight - top - 30}
            onItemSelected={onSelectSection}
            itemContainerStyle={styles.selectItemContainerStyle}
            placeHolder={intl.formatMessage({
              defaultMessage: 'Select a type of template',
              description:
                'Card Template list - Accessibility TextInput Placeholder to select a type of template',
            })}
            style={{ marginHorizontal: 20 }}
            ListHeaderComponent={
              <SearchHeader onChangeText={setSearch} initialValue={search} />
            }
          />

          {templates && (
            <FlatList
              data={templates}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              onScroll={onScroll}
              onEndReached={onEndReached}
              style={styles.cardTemplateList}
              contentContainerStyle={styles.cardTemplateListContentContainer}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={windowWidth - 100 + GAP}
              snapToAlignment="start"
              decelerationRate="fast"
              scrollEventThrottle={16}
              nestedScrollEnabled
              ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
              getItemLayout={getItemLayout}
            />
          )}
        </View>
        <View style={[styles.buttons, { marginBottom: bottom }]}>
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Preview',
              description: 'label of the button allowing to preview template',
            })}
            onPress={onPreview}
            variant="secondary"
          />
          {canSkip && (
            <TouchableOpacity
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
            </TouchableOpacity>
          )}
        </View>
      </View>
      {profile?.webCard && (
        <CardTemplatePreviewModal
          visible={showPreviewModal}
          onRequestClose={onClosePreviewModal}
          onApply={onApplyPreviewTemplate}
          template={previewTemplate}
          webCard={profile?.webCard}
          cardColors={profile?.webCard?.cardColors ?? DEFAULT_COLOR_PALETTE}
          loading={loading}
        />
      )}
    </>
  );
};

// separate component to mitigate re-rendering of the whole list (see https://github.com/facebook/react-native/issues/23400)
const SearchHeader = ({
  initialValue,
  onChangeText,
}: {
  initialValue: string;
  onChangeText: (p: string) => void;
}) => {
  const [search, setSearch] = useState<string | undefined>(initialValue);

  useEffect(() => {
    onChangeText(search ?? '');
  }, [search, onChangeText]);

  const styles = useStyleSheet(stylesheet);
  const intl = useIntl();

  return (
    <View style={styles.searchContainer}>
      <SearchBarStatic
        value={search}
        placeholder={intl.formatMessage({
          defaultMessage: 'Search',
          description: 'Search placeholder in card template list',
        })}
        onChangeText={setSearch}
        autoFocus={!!initialValue}
      />
    </View>
  );
};

export default forwardRef(CardTemplateList);

export type CardTemplateItem = NonNullable<
  NonNullable<
    NonNullable<
      CardTemplateList_cardTemplates$data['cardTemplates']['edges']
    >[number]
  >['node']
>;

type CoverTemplatePreviewModalProps = {
  visible: boolean;
  webCard: WebCardPreview_webCard$key | null;
  template: CardTemplateItem | null;
  cardColors: ColorPalette;
  loading: boolean;
  style?: ViewProps['style'];
  onApply: () => void;
  onRequestClose: () => void;
};

const CardTemplatePreviewModal = ({
  visible,
  webCard,
  template,
  cardColors,
  loading,
  style,
  onApply,
  onRequestClose,
}: CoverTemplatePreviewModalProps) => {
  const cardModules = useModulesData(template?.modules ?? []);

  const intl = useIntl();

  const insets = useScreenInsets();

  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const previewHeight = windowHeight - insets.top - HEADER_HEIGHT;

  if (!visible) {
    return null;
  }
  return (
    <Container
      style={[
        {
          paddingTop: insets.top + (StatusBar.currentHeight ?? 0),
          position: 'absolute',
          top: 0,
          left: 0,
          height: windowHeight - (StatusBar.currentHeight ?? 0),
          width: windowWidth,
          zIndex: 100,
        },
        style,
      ]}
    >
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
      {template && webCard && (
        <WebCardPreview
          webCard={webCard}
          height={previewHeight}
          cardStyle={template.cardStyle}
          cardColors={cardColors}
          style={{ flex: 1 }}
          cardModules={cardModules}
          contentPaddingBottom={insets.bottom}
        />
      )}
    </Container>
  );
};

const GAP = 20;
const ITEM_RADIUS = 20;
const BUTTON_GAP = 10;
const SKIP_BUTTON_HEIGHT = 20;
const LABEL_CONTAINER_HEIGHT = 40;
const SELECT_INPUT_HEIGHT = 43;

const stylesheet = createStyleSheet(appearance => ({
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
    marginBottom: BUTTON_GAP,
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
      borderCurve: 'continuous',
      minHeight: '30%',
    },
    shadow({ appearance, direction: 'bottom' }),
  ],
  webCardContainerRadius: {
    borderRadius: ITEM_RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
    flex: 1,
  },
  webCardList: {
    flex: 1,
  },
  selectItemContainerStyle: {
    paddingLeft: 6,
    height: 20,
  },
  searchContainer: { paddingBottom: 20 },
}));
