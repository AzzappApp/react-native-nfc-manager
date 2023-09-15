import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { isEqual, omit } from 'lodash';
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
import {
  extractLayoutParameters,
  type EditionParameters,
} from '#components/gpu';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import CarouselSelectList from '#ui/CarouselSelectList';
import Container from '#ui/Container';
import IconButton from '#ui/IconButton';
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
  showSuggestedMedia: boolean;
  onSelectedIndexChange: (index: number) => void;
  onCoverStyleChange: (data: CoverStyleData) => void;
  onColorPaletteChange: (palette: ColorPalette) => void;
  onPreviewMediaChange: (media: {
    uri: string;
    kind: 'image' | 'video';
    width: number;
    height: number;
  }) => void;
  onSelectSuggestedMedia: () => void;
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
  onSelectSuggestedMedia,
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
    showTemplatesMedias,
    title,
    subTitle,
    showSuggestedMedia,
    mediaCropParameters,
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
  const onSelectedIndexChangeInner = useCallback(
    (index: number) => {
      onSelectedIndexChange?.(index);
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
      const { uri, kind } = item.media;
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
              item.colorPalettes[colorPalettesIndexes[item.id] ?? 0]
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
      templateWidth,
      timeRange?.startTime,
      timeRange?.duration,
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
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          height: 30,
          marginTop: GAP,
        }}
      >
        <MaskedView
          style={[
            styles.colorPaletteListcontainer,
            { width: templateWidth + 92 },
          ]}
          maskElement={
            <LinearGradient
              colors={['transparent', 'black', 'black', 'transparent']}
              style={{
                height: 30,
                width: templateWidth + 92,
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
              height: 30,
              width: templateWidth + 92,
            }}
            data={selectedItem?.colorPalettes ?? []}
            keyExtractor={paletteKeyExtract}
            renderItem={renderTryptich}
            contentContainerStyle={[
              styles.colorPalettContainer,
              { marginRight: 100, marginBottom: 100 },
            ]}
            onViewableItemsChanged={onViewableItemsChanged}
            windowSize={templateKind === 'video' ? 5 : 11} //21 is the default value.
          />
        </MaskedView>
        {showSuggestedMedia && (
          <Container
            style={{
              position: 'absolute',
              right: (width - templateWidth - 92) / 2,
              bottom: 3,
              height: 30,
              width: 60,
            }}
          >
            <IconButton
              icon={
                templateKind === 'video' ? 'suggested_video' : 'suggested_photo'
              }
              variant="icon"
              iconSize={36}
              onPress={onSelectSuggestedMedia}
            />
          </Container>
        )}
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
        first: { type: Int, defaultValue: 20 }
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
        first: { type: Int, defaultValue: 20 }
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
        first: { type: Int, defaultValue: 20 }
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

    alignItems: 'center',
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
