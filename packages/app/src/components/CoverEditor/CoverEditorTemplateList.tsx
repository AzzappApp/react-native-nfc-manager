import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { isEqual } from 'lodash';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, unstable_batchedUpdates } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import {
  graphql,
  readInlineData,
  useFragment,
  usePaginationFragment,
} from 'react-relay';
import { convertToNonNullArray, shuffle } from '@azzapp/shared/arrayHelpers';
import {
  COVER_CARD_RADIUS,
  COVER_RATIO,
  textOrientationOrDefaut,
  textPositionOrDefaut,
} from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import ColorTriptychRenderer from '#components/ColorTriptychRenderer';
import CoverPreviewRenderer from '#components/CoverPreviewRenderer';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import CarouselSelectList from '#ui/CarouselSelectList';
import PressableOpacity from '#ui/PressableOpacity';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import type { CoverPreviewHandler } from '#components/CoverPreviewRenderer';
import type { EditionParameters } from '#components/gpu';
import type { TimeRange } from '#components/ImagePicker/imagePickerTypes';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';
import type { ColorPalette, CoverStyleData } from './coverEditorTypes';
import type { CoverEditorTemplateList_templates$key } from '@azzapp/relay/artifacts/CoverEditorTemplateList_templates.graphql';
import type { CoverEditorTemplateList_viewer$key } from '@azzapp/relay/artifacts/CoverEditorTemplateList_viewer.graphql';
import type {
  CoverEditorTemplateListItem_coverTemplate$key,
  CoverTemplateKind,
} from '@azzapp/relay/artifacts/CoverEditorTemplateListItem_coverTemplate.graphql';
import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';
import type { Ref } from 'react';
import type { ListRenderItemInfo, ViewToken } from 'react-native';

export type CoverEditorProps = {
  viewer: CoverEditorTemplateList_viewer$key;
  templateKind: CoverTemplateKind;
  media: {
    uri: string;
    kind: 'image' | 'video';
    width: number;
    height: number;
  } | null;
  maskUri: string | null;
  title: string | null;
  subTitle: string | null;
  width: number;
  height: number;
  mediaParameters: EditionParameters | null;
  timeRange: TimeRange | null;
  currentCoverStyle: CoverStyleData | null;
  cardColors: ColorPalette | null;
  coverPreviewRef: Ref<CoverPreviewHandler> | null;
  mediaComputing: boolean;
  showTemplatesMedias: boolean;
  onCoverStyleChange: (data: CoverStyleData) => void;
  onColorPaletteChange: (palette: ColorPalette) => void;
  onPreviewMediaChange: (media: {
    uri: string;
    kind: 'image' | 'video';
    width: number;
    height: number;
  }) => void;
};

const CoverEditorTemplateList = ({
  viewer: viewerKey,
  templateKind = 'people',
  media,
  maskUri,
  mediaParameters,
  timeRange,
  title,
  subTitle,
  width,
  height,
  currentCoverStyle,
  cardColors,
  coverPreviewRef,
  mediaComputing,
  showTemplatesMedias,
  onCoverStyleChange,
  onColorPaletteChange,
  onPreviewMediaChange,
}: CoverEditorProps) => {
  const viewer = useFragment(
    graphql`
      fragment CoverEditorTemplateList_viewer on Viewer
      @argumentDefinitions(
        initialTemplateKind: { type: CoverTemplateKind, defaultValue: people }
      ) {
        colorPalettes(first: 100) {
          edges {
            node {
              id
              dark
              primary
              light
            }
          }
        }
        ...CoverEditorTemplateList_templates
          @arguments(kind: $initialTemplateKind)
      }
    `,
    viewerKey,
  );

  const {
    data: { coverTemplates },
    refetch,
    loadNext,
    isLoadingNext,
    hasNext,
  } = usePaginationFragment(
    graphql`
      fragment CoverEditorTemplateList_templates on Viewer
      @refetchable(queryName: "CoverEditorTemplateList_templates_query")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 20 }
        kind: { type: CoverTemplateKind, defaultValue: people }
      ) {
        coverTemplates(kind: $kind, after: $after, first: $first)
          @connection(
            key: "CoverEditorTemplateList_connection_coverTemplates"
          ) {
          edges {
            node {
              ...CoverEditorTemplateListItem_coverTemplate
            }
          }
        }
      }
    `,
    viewer as CoverEditorTemplateList_templates$key,
  );

  const templateKindRef = useRef<CoverTemplateKind>(templateKind);

  useEffect(() => {
    if (templateKindRef.current !== templateKind) {
      templateKindRef.current = templateKind;
      refetch({ kind: templateKind });
    }
  }, [refetch, templateKind]);

  const onEndTemplateReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  const colorPalettes = useMemo(() => {
    return convertToNonNullArray(
      (viewer.colorPalettes.edges ?? []).map(edge => edge?.node ?? null),
    );
  }, [viewer.colorPalettes.edges]);

  const items = useMemo<TemplateListItem[]>(() => {
    const templates = convertToNonNullArray(
      (coverTemplates.edges ?? []).map(edge => edge?.node ?? null),
    );
    const items: TemplateListItem[] = templates.map((item, index) => {
      const {
        id,
        previewMedia,
        kind,
        data: {
          titleStyle,
          subTitleStyle,
          textOrientation,
          textPosition,
          background,
          backgroundColor,
          backgroundPatternColor,
          foreground,
          foregroundColor,
          mediaFilter,
          mediaParameters,
          merged,
        },
        colorPalette,
      } = readInlineData(
        graphql`
          fragment CoverEditorTemplateListItem_coverTemplate on CoverTemplate
          @inline {
            id
            kind
            colorPalette {
              id
            }
            previewMedia {
              __typename
              id
              uri
              width
              height
            }
            data {
              background {
                id
                uri
              }
              backgroundColor
              backgroundPatternColor
              foreground {
                id
                uri
              }
              foregroundColor
              mediaFilter
              mediaParameters
              merged
              subTitleStyle {
                color
                fontFamily
                fontSize
              }
              textOrientation
              textPosition
              titleStyle {
                color
                fontFamily
                fontSize
              }
            }
          }
        `,
        item as CoverEditorTemplateListItem_coverTemplate$key,
      );

      const colorPaletteIndex = colorPalettes.findIndex(
        palette => palette.id === colorPalette.id,
      );
      const templateColorPalettes = computeTemplatesPalettes(
        index,
        colorPaletteIndex,
        colorPalettes[colorPaletteIndex] ?? null,
        colorPalettes,
      );

      return {
        id,
        title,
        titleStyle,
        subTitle,
        subTitleStyle,
        textOrientation: textOrientationOrDefaut(textOrientation),
        textPosition: textPositionOrDefaut(textPosition),
        media:
          showTemplatesMedias || !media
            ? {
                uri: previewMedia.uri,
                kind:
                  previewMedia.__typename === 'MediaImage' ? 'image' : 'video',
                width: previewMedia.width,
                height: previewMedia.height,
              }
            : media,
        mediaFilter,
        mediaParameters: mediaParameters as EditionParameters,
        maskUri: kind === 'people' && !showTemplatesMedias ? maskUri : null,
        background: background ?? null,
        backgroundColor,
        backgroundPatternColor,
        foreground: foreground ?? null,
        foregroundColor,
        merged,
        colorPalettes: templateColorPalettes,
      };
    });

    if (currentCoverStyle) {
      let colorPalette: ColorPalette;
      let colorPaletteIndex: number;
      if (cardColors) {
        colorPaletteIndex = colorPalettes.findIndex(
          palette =>
            palette.primary === cardColors.primary &&
            palette.dark === cardColors.dark &&
            palette.light === cardColors.light,
        );
        colorPalette = colorPalettes[colorPaletteIndex] ?? cardColors;
      } else {
        colorPalette = colorPalettes[0];
        colorPaletteIndex = 0;
      }

      const coverColorPalettes = computeTemplatesPalettes(
        -2,
        colorPaletteIndex,
        colorPalette,
        colorPalettes,
      );

      items.unshift({
        id: 'cover',
        title,
        subTitle: subTitle!,
        media: media!,
        maskUri,
        ...currentCoverStyle,
        colorPalettes: coverColorPalettes,
      });
    }

    return items;
  }, [
    coverTemplates.edges,
    currentCoverStyle,
    colorPalettes,
    title,
    subTitle,
    showTemplatesMedias,
    media,
    maskUri,
    cardColors,
  ]);

  const [selectedItem, setSelectedItem] = useState<TemplateListItem | null>(
    items[0] ?? null,
  );
  const [colorPalettesIndexes, setColorPalettesIndexes] = useState<
    Record<string, number>
  >({});

  const carouselRef = useRef<CarouselSelectListHandle>(null);
  const colorPalletesListRef = useRef<FlatList<ColorPalette> | null>(null);
  const onSelectedIndexChange = useCallback(
    (index: number) => {
      const selectedItem = items[index];
      unstable_batchedUpdates(() => {
        setSelectedItem(selectedItem);
        colorPalletesListRef.current?.scrollToIndex({
          index: colorPalettesIndexes[selectedItem.id] ?? 0,
          viewOffset: 16,
          animated: false,
        });
      });
    },
    [colorPalettesIndexes, items],
  );

  const scrollToIndex = useCallback((index: number) => {
    carouselRef.current?.scrollToIndex(index);
  }, []);

  useEffect(() => {
    if (selectedItem == null) {
      return;
    }
    const {
      titleStyle,
      subTitleStyle,
      textOrientation,
      textPosition,
      mediaFilter,
      mediaParameters,
      background,
      backgroundColor,
      backgroundPatternColor,
      foreground,
      foregroundColor,
      segmented,
      merged,
    } = selectedItem;

    onCoverStyleChange({
      titleStyle,
      subTitleStyle,
      textOrientation,
      textPosition,
      mediaFilter,
      mediaParameters,
      background: background ?? null,
      backgroundColor,
      backgroundPatternColor,
      foreground: foreground ?? null,
      foregroundColor,
      merged,
      segmented: segmented ?? templateKind === 'people',
    });

    if (!media) {
      onPreviewMediaChange(selectedItem.media);
    }
  }, [
    media,
    onCoverStyleChange,
    onPreviewMediaChange,
    selectedItem,
    templateKind,
  ]);

  const viewableIndexRef = useRef<number[]>([]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableIndexRef.current = viewableItems.map(item => item.index!);
    },
    [],
  );

  const onNextColorPalette = useCallback(() => {
    if (!selectedItem) {
      return;
    }
    const index = colorPalettesIndexes[selectedItem.id] ?? 0;
    const nextIndex = (index + 1) % selectedItem.colorPalettes.length;
    setColorPalettesIndexes({
      ...colorPalettesIndexes,
      [selectedItem.id]: nextIndex,
    });
    if (viewableIndexRef.current.includes(nextIndex)) {
      return;
    }
    colorPalletesListRef.current?.scrollToIndex({
      index: nextIndex,
      viewOffset: 16,
    });
  }, [colorPalettesIndexes, selectedItem]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }
    const index = colorPalettesIndexes[selectedItem.id] ?? 0;
    onColorPaletteChange(selectedItem.colorPalettes[index]);
  }, [colorPalettesIndexes, onColorPaletteChange, selectedItem]);

  const onSelectColorPalette = useCallback(
    (index: number) => {
      if (!selectedItem) {
        return;
      }
      setColorPalettesIndexes({
        ...colorPalettesIndexes,
        [selectedItem.id ?? '']: index,
      });
    },
    [colorPalettesIndexes, selectedItem],
  );

  const carouselHeight = height - PALETTE_LIST_HEIGHT - GAP;
  const templateWidth = COVER_RATIO * carouselHeight;

  const styles = useStyleSheet(styleSheet);
  const renderTemplate = useCallback(
    ({ item, index }: ListRenderItemInfo<TemplateListItem>) => {
      const isSelectedItem = item.id === selectedItem?.id;
      const onPress = () => {
        if (isSelectedItem) {
          onNextColorPalette();
        } else {
          scrollToIndex(index);
        }
      };
      const { uri, kind, width: mediaWidth, height: mediaHeight } = item.media;
      return (
        <PressableScaleHighlight
          style={{
            overflow: 'visible',
            borderRadius: COVER_CARD_RADIUS * templateWidth,
          }}
          onPress={onPress}
        >
          <CoverPreviewRendererMemo
            ref={isSelectedItem ? coverPreviewRef : null}
            uri={uri}
            kind={kind}
            maskUri={item.maskUri}
            startTime={timeRange?.startTime}
            duration={timeRange?.duration}
            backgroundColor={item.backgroundColor}
            backgroundImageUri={item.background?.uri}
            backgroundImageTintColor={item.backgroundPatternColor}
            foregroundId={item.foreground?.id}
            foregroundImageUri={item.foreground?.uri}
            foregroundImageTintColor={item.foregroundColor}
            backgroundMultiply={item.merged}
            editionParameters={{
              ...item.mediaParameters,
              ...mediaParameters,
            }}
            filter={item.mediaFilter}
            title={item.title}
            titleStyle={item.titleStyle}
            subTitle={item.subTitle}
            subTitleStyle={item.subTitleStyle}
            textOrientation={item.textOrientation}
            textPosition={item.textPosition}
            // other props
            colorPalette={
              item.colorPalettes[colorPalettesIndexes[item.id] ?? 0]
            }
            mediaSize={{ width: mediaWidth, height: mediaHeight }}
            computing={mediaComputing}
            cropEditionMode={false}
            height={carouselHeight}
            style={styles.templateItemContainer}
          />
        </PressableScaleHighlight>
      );
    },
    [
      selectedItem,
      templateWidth,
      coverPreviewRef,
      timeRange?.startTime,
      timeRange?.duration,
      mediaParameters,
      colorPalettesIndexes,
      mediaComputing,
      carouselHeight,
      styles.templateItemContainer,
      onNextColorPalette,
      scrollToIndex,
    ],
  );

  const renderTryptich = useCallback(
    ({ item, index }: ListRenderItemInfo<ColorPalette>) => {
      const currentColorPalette =
        selectedItem?.colorPalettes[
          colorPalettesIndexes[selectedItem?.id] ?? 0
        ];
      const selected = isEqual(item, currentColorPalette);
      return (
        <View
          style={{
            width: 30,
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PressableOpacity
            style={[
              styles.colorPaletteContainer,
              selected && styles.colorPaletteSelected,
            ]}
            onPress={() => onSelectColorPalette(index)}
          >
            <ColorTriptychRenderer width={20} height={20} {...item} />
          </PressableOpacity>
        </View>
      );
    },
    [
      colorPalettesIndexes,
      onSelectColorPalette,
      selectedItem?.colorPalettes,
      selectedItem?.id,
      styles,
    ],
  );

  return (
    <>
      <CarouselSelectList
        ref={carouselRef}
        data={items}
        scaleRatio={0.5}
        keyExtractor={templateKeyExtractor}
        renderItem={renderTemplate}
        onEndReached={onEndTemplateReached}
        style={styles.carousel}
        width={width}
        height={carouselHeight}
        itemWidth={templateWidth}
        contentContainerStyle={styles.carouselContentContainer}
        itemContainerStyle={styles.carouselContentContainer}
        onSelectedIndexChange={onSelectedIndexChange}
      />
      <MaskedView
        style={[
          styles.colorPaletteListcontainer,
          { width: templateWidth + 92 },
          { backgroundColor: 'blue' },
        ]}
        maskElement={
          <LinearGradient
            colors={['transparent', 'black', 'black', 'transparent']}
            style={{ height: 30, width: templateWidth + 92 }}
            locations={[0.0, 0.05, 0.95, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        }
      >
        <FlatList
          ref={colorPalletesListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ height: 30, width: templateWidth + 92 }}
          data={selectedItem?.colorPalettes ?? []}
          keyExtractor={paletteKeyExtract}
          renderItem={renderTryptich}
          contentContainerStyle={styles.colorPalettContainer}
          onViewableItemsChanged={onViewableItemsChanged}
        />
      </MaskedView>
    </>
  );
};

export default CoverEditorTemplateList;

const CoverPreviewRendererMemo = memo(
  CoverPreviewRenderer,
  (prevProps, nextProps) => isEqual(prevProps, nextProps),
);

const computeTemplatesPalettes = (
  itemIndex: number,
  colorPaletteIndex: number,
  colorPlalette: ColorPalette | null,
  colorPalettes: ColorPalette[],
) => {
  let result = colorPalettes.slice();
  if (colorPaletteIndex !== -1) {
    result.splice(colorPaletteIndex, 1);
  }
  result = shuffle(result, itemIndex);
  if (colorPlalette !== null) {
    result.unshift(colorPlalette);
  }
  return result;
};

const templateKeyExtractor = (item: TemplateListItem) => item.id;

const paletteKeyExtract = (item: ColorPalette) => item.id ?? 'cover';

type TemplateListItem = {
  id: string;
  title: string | null;
  titleStyle: TextStyle;
  media: {
    uri: string;
    kind: 'image' | 'video';
    width: number;
    height: number;
  };
  subTitle: string | null;
  subTitleStyle: TextStyle;
  textOrientation: TextOrientation;
  textPosition: TextPosition;
  mediaFilter: string | null;
  mediaParameters: EditionParameters;
  maskUri: string | null;
  background: {
    readonly id: string;
    readonly uri: string;
  } | null;
  backgroundColor: string | null;
  backgroundPatternColor: string | null;
  foreground: {
    readonly id: string;
    readonly uri: string;
  } | null;
  foregroundColor: string | null;
  merged: boolean;
  segmented?: boolean;
  colorPalettes: ColorPalette[];
};

const PALETTE_LIST_HEIGHT = 30;
const GAP = 16;

const styleSheet = createStyleSheet(theme => ({
  carousel: { flexGrow: 0, overflow: 'visible', alignSelf: 'center' },
  carouselContentContainer: { flexGrow: 0, overflow: 'visible' },
  templateItemContainer: {
    backgroundColor: theme === 'light' ? '#fff' : '#000',
    ...shadow(theme, 'center'),
  },
  colorPaletteListcontainer: {
    alignSelf: 'center',
    marginTop: GAP,
    height: PALETTE_LIST_HEIGHT,
  },
  colorPalettContainer: {
    paddingHorizontal: GAP,
    gap: GAP,
  },
  colorPaletteContainer: {
    width: PALETTE_LIST_HEIGHT,
    height: PALETTE_LIST_HEIGHT,
    borderRadius: PALETTE_LIST_HEIGHT / 2,
    borderWidth: 3,
    borderColor: colors.grey100,
    transform: [{ scale: 0.8 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPaletteSelected: {
    borderColor: colors.black,
    transform: [{ scale: 1 }],
  },
}));
