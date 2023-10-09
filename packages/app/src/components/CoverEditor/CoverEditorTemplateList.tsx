import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { isEqual, omit } from 'lodash';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import {
  graphql,
  readInlineData,
  useFragment,
  usePaginationFragment,
} from 'react-relay';
import { convertToNonNullArray, shuffle } from '@azzapp/shared/arrayHelpers';
import { DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import {
  COVER_CARD_RADIUS,
  COVER_RATIO,
  textOrientationOrDefaut,
  textPositionOrDefaut,
} from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import ColorTriptychRenderer from '#components/ColorTriptychRenderer';
import CoverPreviewRenderer from '#components/CoverPreviewRenderer';
import {
  extractLayoutParameters,
  type EditionParameters,
} from '#components/gpu';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import CarouselSelectList from '#ui/CarouselSelectList';
import PressableOpacity from '#ui/PressableOpacity';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import type { TimeRange } from '#components/ImagePicker/imagePickerTypes';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';
import type { ColorPalette, CoverStyleData } from './coverEditorTypes';
import type { CoverEditorTemplateList_templates$key } from '@azzapp/relay/artifacts/CoverEditorTemplateList_templates.graphql';
import type { CoverEditorTemplateList_templatesOthers$key } from '@azzapp/relay/artifacts/CoverEditorTemplateList_templatesOthers.graphql';
import type { CoverEditorTemplateList_templatesPeople$key } from '@azzapp/relay/artifacts/CoverEditorTemplateList_templatesPeople.graphql';
import type { CoverEditorTemplateList_templatesVideos$key } from '@azzapp/relay/artifacts/CoverEditorTemplateList_templatesVideos.graphql';
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
  mediaCropParameters: EditionParameters | null;
  timeRange: TimeRange | null;
  currentCoverStyle: CoverStyleData | null;
  cardColors: ColorPalette | null;
  mediaComputing: boolean;
  showTemplatesMedias: boolean;
  initialSelectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  onCoverStyleChange: (data: CoverStyleData) => void;
  onColorPaletteChange: (palette: ColorPalette) => void;
  onPreviewMediaChange: (media: {
    uri: string;
    kind: 'image' | 'video';
    width: number;
    height: number;
  }) => void;
  showSuggestedMedia: boolean;
};

const CoverEditorTemplateList = ({
  viewer: viewerKey,
  templateKind = 'people',
  media,
  maskUri,
  mediaCropParameters,
  timeRange,
  title,
  subTitle,
  width,
  height,
  currentCoverStyle,
  cardColors,
  mediaComputing,
  showTemplatesMedias,
  initialSelectedIndex,
  showSuggestedMedia,
  onCoverStyleChange,
  onColorPaletteChange,
  onPreviewMediaChange,
  onSelectedIndexChange,
}: CoverEditorProps) => {
  const viewer = useFragment(
    graphql`
      fragment CoverEditorTemplateList_viewer on Viewer {
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
        profile {
          id
          profileKind
        }
        ...CoverEditorTemplateList_templates
      }
    `,
    viewerKey,
  );

  const { coverTemplates, loadNext, isLoadingNext, hasNext } =
    useCoverTemplates(viewer, templateKind);

  const onEndTemplateReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  //in some casser viewer.colorPalette seems to be null (sentry crash
  const colorPalettes = useMemo(() => {
    return convertToNonNullArray(
      (viewer?.colorPalettes?.edges ?? []).map(edge => edge?.node ?? null),
    );
  }, [viewer?.colorPalettes?.edges]);

  const items = useMemo<TemplateListItem[]>(() => {
    const templates = convertToNonNullArray(
      (coverTemplates?.edges ?? []).map(edge => edge?.node ?? null),
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
          @inline
          @argumentDefinitions(
            cappedPixelRatio: {
              type: "Float!"
              provider: "../providers/CappedPixelRatio.relayprovider"
            }
          ) {
            id
            kind
            colorPalette {
              id
            }
            previewMedia {
              __typename
              id
              uri(width: 256, pixelRatio: $cappedPixelRatio)
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
        cardColors,
      );

      const templateEditionParameters =
        mediaParameters as EditionParameters | null;

      const displayTemplateMedia = showTemplatesMedias || !media;
      const templateStyleParameters = templateEditionParameters
        ? extractLayoutParameters(templateEditionParameters)[1]
        : null;
      return {
        id,
        title,
        titleStyle,
        subTitle,
        subTitleStyle,
        textOrientation: textOrientationOrDefaut(textOrientation),
        textPosition: textPositionOrDefaut(textPosition),
        media:
          showSuggestedMedia && media
            ? media
            : displayTemplateMedia
            ? {
                uri: previewMedia.uri,
                kind:
                  previewMedia.__typename === 'MediaImage' ? 'image' : 'video',
                width: previewMedia.width,
                height: previewMedia.height,
              }
            : media,
        mediaFilter,
        mediaParameters: displayTemplateMedia
          ? (templateEditionParameters as EditionParameters | null) ?? {}
          : {
              ...templateStyleParameters,
              ...mediaCropParameters,
            },
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

    if (currentCoverStyle && media) {
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
        cardColors,
      );

      const coverStyleParameters = extractLayoutParameters(
        currentCoverStyle.mediaParameters,
      )[1];
      items.unshift({
        id: 'cover',
        title,
        subTitle: subTitle!,
        media,
        maskUri,
        ...currentCoverStyle,
        mediaParameters: {
          ...coverStyleParameters,
          ...mediaCropParameters,
        },
        colorPalettes: coverColorPalettes,
      });
    }

    return items;
  }, [
    coverTemplates?.edges,
    currentCoverStyle,
    media,
    colorPalettes,
    cardColors,
    showTemplatesMedias,
    title,
    subTitle,
    showSuggestedMedia,
    mediaCropParameters,
    maskUri,
  ]);

  const [selectedItem, setSelectedItem] = useState<TemplateListItem | null>(
    items[0] ?? null,
  );
  const [colorPalettesIndexes, setColorPalettesIndexes] = useState<
    Record<string, number>
  >({ cover: cardColors ? -1 : 0 });

  const carouselRef = useRef<CarouselSelectListHandle>(null);
  const colorPalletesListRef = useRef<FlatList<ColorPalette> | null>(null);
  const onSelectedIndexChangeInner = useCallback(
    (index: number) => {
      onSelectedIndexChange?.(index);
      const selectedItem = items[index];
      setSelectedItem(selectedItem);
      const colorPaletteIndex = colorPalettesIndexes[selectedItem.id] ?? 0;
      if (colorPaletteIndex !== -1) {
        colorPalletesListRef.current?.scrollToIndex({
          index: colorPaletteIndex,
          viewOffset: 16,
          animated: false,
        });
      }
    },
    [colorPalettesIndexes, items, onSelectedIndexChange],
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
    onColorPaletteChange(
      index === -1
        ? cardColors ?? DEFAULT_COLOR_PALETTE
        : selectedItem.colorPalettes[index],
    );
  }, [
    cardColors,
    colorPalettesIndexes,
    items,
    onColorPaletteChange,
    selectedItem,
  ]);

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
      const { uri, kind } = item.media;
      const colorPaletteIndex = colorPalettesIndexes[item.id] ?? 0;

      return (
        <PressableScaleHighlight
          style={{
            overflow: 'visible',
            borderRadius: COVER_CARD_RADIUS * templateWidth,
          }}
          onPress={onPress}
        >
          <CoverPreviewRendererMemo
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
            editionParameters={item.mediaParameters}
            filter={item.mediaFilter}
            title={item.title}
            titleStyle={item.titleStyle}
            subTitle={item.subTitle}
            subTitleStyle={item.subTitleStyle}
            textOrientation={item.textOrientation}
            textPosition={item.textPosition}
            // other props
            colorPalette={
              colorPaletteIndex === -1
                ? cardColors!
                : item.colorPalettes[colorPaletteIndex]
            }
            computing={mediaComputing}
            height={carouselHeight}
            paused={!isSelectedItem}
            style={styles.templateItemContainer}
          />
        </PressableScaleHighlight>
      );
    },
    [
      selectedItem?.id,
      colorPalettesIndexes,
      templateWidth,
      timeRange?.startTime,
      timeRange?.duration,
      cardColors,
      mediaComputing,
      carouselHeight,
      styles.templateItemContainer,
      onNextColorPalette,
      scrollToIndex,
    ],
  );

  const renderTryptich = useCallback(
    ({ item, index }: Omit<ListRenderItemInfo<ColorPalette>, 'separators'>) => {
      const currentColorPaletteIndex = selectedItem
        ? colorPalettesIndexes[selectedItem?.id] ?? 0
        : 0;

      const selected = currentColorPaletteIndex === index;

      return (
        <View
          style={{
            width: 30,
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
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
      selectedItem,
      styles.colorPaletteContainer,
      styles.colorPaletteSelected,
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
        style={styles.carousel}
        width={width}
        height={carouselHeight}
        itemWidth={templateWidth}
        contentContainerStyle={styles.carouselContentContainer}
        itemContainerStyle={styles.carouselContentContainer}
        initialScrollIndex={initialSelectedIndex}
        onSelectedIndexChange={onSelectedIndexChangeInner}
        onEndReached={onEndTemplateReached}
      />
      <View
        style={{
          height: PALETTE_LIST_HEIGHT,
          width: templateWidth + 92,
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'center',
          marginTop: GAP,
        }}
      >
        {cardColors && (
          <>
            {renderTryptich({ item: cardColors!, index: -1 })}
            <View
              style={{
                width: 5,
                height: 5,
                backgroundColor: colors.black,
                borderRadius: 5,
                marginLeft: GAP,
              }}
            />
          </>
        )}
        <MaskedView
          style={{
            flex: 1,
            height: PALETTE_LIST_HEIGHT,
          }}
          maskElement={
            <LinearGradient
              colors={['transparent', 'black', 'black', 'transparent']}
              style={{
                height: 30,
                flex: 1,
              }}
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
            style={{
              height: PALETTE_LIST_HEIGHT,
              flex: 1,
            }}
            data={selectedItem?.colorPalettes ?? []}
            keyExtractor={paletteKeyExtract}
            renderItem={renderTryptich}
            contentContainerStyle={styles.colorPalettContainer}
            onViewableItemsChanged={onViewableItemsChanged}
            getItemLayout={(_, index) => ({
              length: 30 + GAP,
              offset: index * 30 + Math.max(GAP * index - 1, 0),
              index,
            })}
          />
        </MaskedView>
      </View>
    </>
  );
};

export default CoverEditorTemplateList;

const useCoverTemplates = (
  viewerKey: CoverEditorTemplateList_templates$key,
  kind: string,
) => {
  const viewer = useFragment(
    graphql`
      fragment CoverEditorTemplateList_templates on Viewer {
        ...CoverEditorTemplateList_templatesPeople
        ...CoverEditorTemplateList_templatesVideos
        ...CoverEditorTemplateList_templatesOthers
      }
    `,
    viewerKey,
  );

  const peopleFragmentResult = usePaginationFragment(
    graphql`
      fragment CoverEditorTemplateList_templatesPeople on Viewer
      @refetchable(queryName: "CoverEditorTemplateList_people_templates_query")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 15 }
      ) {
        peopleCoverTemplates: coverTemplates(
          kind: people
          after: $after
          first: $first
        )
          @connection(
            key: "CoverEditorTemplateList_connection_peopleCoverTemplates"
          ) {
          edges {
            node {
              ...CoverEditorTemplateListItem_coverTemplate
            }
          }
        }
      }
    `,
    viewer as CoverEditorTemplateList_templatesPeople$key,
  );

  const videosFragmentResult = usePaginationFragment(
    graphql`
      fragment CoverEditorTemplateList_templatesVideos on Viewer
      @refetchable(queryName: "CoverEditorTemplateList_videos_templates_query")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 15 }
      ) {
        videosCoverTemplates: coverTemplates(
          kind: video
          after: $after
          first: $first
        )
          @connection(
            key: "CoverEditorTemplateList_connection_videosCoverTemplates"
          ) {
          edges {
            node {
              ...CoverEditorTemplateListItem_coverTemplate
            }
          }
        }
      }
    `,
    viewer as CoverEditorTemplateList_templatesVideos$key,
  );

  const othersFragmentResult = usePaginationFragment(
    graphql`
      fragment CoverEditorTemplateList_templatesOthers on Viewer
      @refetchable(queryName: "CoverEditorTemplateList_others_templates_query")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 15 }
      ) {
        othersCoverTemplates: coverTemplates(
          kind: others
          after: $after
          first: $first
        )
          @connection(
            key: "CoverEditorTemplateList_connection_othersCoverTemplates"
          ) {
          edges {
            node {
              ...CoverEditorTemplateListItem_coverTemplate
            }
          }
        }
      }
    `,
    viewer as CoverEditorTemplateList_templatesOthers$key,
  );

  switch (kind) {
    case 'people':
      return {
        coverTemplates: peopleFragmentResult.data.peopleCoverTemplates,
        ...omit(peopleFragmentResult, 'data'),
      };
    case 'video':
      return {
        coverTemplates: videosFragmentResult.data.videosCoverTemplates,
        ...omit(videosFragmentResult, 'data'),
      };
    default:
      return {
        coverTemplates: othersFragmentResult.data.othersCoverTemplates,
        ...omit(othersFragmentResult, 'data'),
      };
  }
};

const CoverPreviewRendererMemo = memo(
  CoverPreviewRenderer,
  (prevProps, nextProps) => isEqual(prevProps, nextProps),
);

const computeTemplatesPalettes = (
  itemIndex: number,
  colorPaletteIndex: number,
  colorPlalette: ColorPalette | null,
  colorPalettes: ColorPalette[],
  currentColorPalette: ColorPalette | null,
) => {
  let result = colorPalettes.slice();
  if (colorPaletteIndex !== -1) {
    result.splice(colorPaletteIndex, 1);
  }
  result = shuffle(result, itemIndex);
  if (colorPlalette !== null) {
    result.unshift(colorPlalette);
  }

  if (currentColorPalette) {
    result = result.filter(palette => {
      const isSame =
        palette.primary === currentColorPalette.primary &&
        palette.dark === currentColorPalette.dark &&
        palette.light === currentColorPalette.light;

      return !isSame;
    });
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

const styleSheet = createStyleSheet(appearance => ({
  carousel: { flexGrow: 0, overflow: 'visible', alignSelf: 'center' },
  carouselContentContainer: { flexGrow: 0, overflow: 'visible' },
  templateItemContainer: {
    backgroundColor: appearance === 'light' ? '#fff' : '#000',
    ...shadow(appearance, 'center'),
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
    borderColor: appearance === 'dark' ? colors.grey900 : colors.grey100,
    transform: [{ scale: 0.8 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPaletteSelected: {
    borderColor: appearance === 'dark' ? colors.white : colors.black,
    transform: [{ scale: 1 }],
  },
}));
