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
import { View, FlatList, useWindowDimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useLazyLoadQuery, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import Button, { BUTTON_HEIGHT } from '#ui/Button';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import PressableNative from '#ui/PressableNative';
import SelectSection from '#ui/SelectSection';
import Text from '#ui/Text';
import { useModulesData } from './cardModules/ModuleData';
import { CancelHeaderButton } from './commonsButtons';
import WebCardPreview from './WebCardPreview';
import type { CardTemplateList_cardTemplates$key } from '@azzapp/relay/artifacts/CardTemplateList_cardTemplates.graphql';
import type { CardTemplateListQuery } from '@azzapp/relay/artifacts/CardTemplateListQuery.graphql';
import type { CoverRenderer_profile$key } from '@azzapp/relay/artifacts/CoverRenderer_profile.graphql';
import type { ModuleData_cardModules$key } from '@azzapp/relay/artifacts/ModuleData_cardModules.graphql';
import type { WebCardBackground_profile$key } from '@azzapp/relay/artifacts/WebCardBackground_profile.graphql';
import type {
  CardStyle,
  ColorPalette,
  CardTemplateType,
} from '@azzapp/shared/cardHelpers';
import type { ForwardedRef, ReactNode } from 'react';
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

export type CardTemplatelistHandle = {
  onSubmit: () => void;
};

const CardTemplateList = (
  {
    height,
    onApplyTemplate,
    onSkip,
    loading,
    style,
    previewModalStyle,
    onPreviewModal,
    onPreviewModalClose,
    ...props
  }: CardTemplateListProps,
  forwardRef: ForwardedRef<CardTemplatelistHandle>,
) => {
  const { viewer } = useLazyLoadQuery<CardTemplateListQuery>(
    graphql`
      query CardTemplateListQuery {
        viewer {
          ...CardTemplateList_cardTemplates
          cardTemplateTypes {
            id
            label
            profileCategory {
              id
              label
            }
          }
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

  const { profile, cardTemplateTypes } = viewer;
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment CardTemplateList_cardTemplates on Viewer
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
      ),
    [data?.cardTemplates?.edges, profile],
  );

  const onSubmit = () => {
    if (!templates) {
      return;
    }

    onApplyTemplate(templates[selectedIndexRef.current].id);
  };

  useImperativeHandle(forwardRef, () => ({
    onSubmit,
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
    SELECT_INPUT_HEIGHT -
    (canSkip ? SKIP_BUTTON_HEIGHT + BUTTON_GAP : 0);

  const intl = useIntl();

  const getItemLayout = (_data: any, index: number) => ({
    length: itemWidth,
    offset: itemWidth * index + GAP * (index - 1),
    index,
  });

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
            >
              {item.previewMedia && (
                <Image
                  source={{
                    uri: item.previewMedia.uri,
                    width: itemWidth,
                    height: imageHeight!,
                  }}
                  style={{
                    width: itemWidth,
                    height: imageHeight!,
                  }}
                  priority={index === 0 ? 'high' : 'normal'}
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

  // #region Section List card category
  const sectionKeyExtractor = (item: { id: string }) => {
    return item.id;
  };

  const { height: windowHeight } = useWindowDimensions();
  const { top } = useSafeAreaInsets();

  const [selectedCardTemplateType, setSelectedCaredtemplateType] = useState<
    { id: string; title: string } | undefined
  >(undefined);

  const templateTypesByProfileCategory = useMemo(() => {
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
          const label = curr.profileCategory?.label ?? '-';

          const existingSection = acc.find(section => section.title === label);

          if (existingSection) {
            existingSection.data.push({
              id: curr.id,
              title: curr.label ?? '-',
              data: [],
            });
          } else {
            acc.push({
              title: label,
              data: [{ id: curr.id, title: curr.label ?? '-', data: [] }],
            });
          }

          return acc;
        },
        [],
      ) ?? []
    );
  }, [cardTemplateTypes]);

  const onSelectSection = (item: { id: string; title: string }) => {
    setSelectedCaredtemplateType(item);
    refetch(
      { cardTemplateTypeId: fromGlobalId(item.id).id, after: null },
      { fetchPolicy: 'store-and-network' },
    );
  };

  useEffect(() => {
    if (!selectedCardTemplateType && templates?.length > 0) {
      setSelectedCaredtemplateType({
        id: templates[0].cardTemplateType?.id ?? '-',
        title: templates[0].cardTemplateType?.label ?? '-',
      });
    }
  }, [selectedCardTemplateType, templates]);
  // #endregion

  return (
    <>
      <View style={[styles.root, style]} {...props}>
        <View style={{ flex: 1 }}>
          <SelectSection
            nativeID="activities"
            accessibilityLabelledBy="activitiesLabel"
            sections={templateTypesByProfileCategory}
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
          />

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
              ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
              getItemLayout={getItemLayout}
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

export default forwardRef(CardTemplateList);

type CardTemplateItem = {
  id: string;
  previewMedia: { uri: string; aspectRatio: number } | null;
  label: string | null;
  cardStyle: CardStyle;
  cardTemplateType: CardTemplateType;
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
  const insets = useScreenInsets();

  const previewHeight = windowHeight - insets.top - HEADER_HEIGHT;

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
      <Container style={{ flex: 1, paddingTop: insets.top }}>
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
            contentPaddingBottom={insets.bottom}
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
const LABEL_CONTAINER_HEIGHT = 40;
const SELECT_INPUT_HEIGHT = 43;

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
  selectItemContainerStyle: {
    paddingLeft: 6,
    height: 20,
  },
}));
