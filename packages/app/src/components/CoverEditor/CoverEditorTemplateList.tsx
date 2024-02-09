import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { isEqual, omit } from 'lodash';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import {
  PixelRatio,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
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
  textOrientationOrDefault,
  textPositionOrDefault,
} from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import ColorTriptychRenderer from '#components/ColorTriptychRenderer';
import CoverLoadingIndicator from '#components/CoverLoadingIndicator';
import CoverPreviewRenderer from '#components/CoverPreviewRenderer';
import {
  extractLayoutParameters,
  type EditionParameters,
  cropDataForAspectRatio,
} from '#components/gpu';
import { useScreenHasFocus } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ActivityIndicator from '#ui/ActivityIndicator';
import CarouselSelectList from '#ui/CarouselSelectList';
import PressableOpacity from '#ui/PressableOpacity';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import SimpleCarouselSelectList from '#ui/SimpleCarouselSelectList';
import CoverErrorRenderer from '../CoverErrorRenderer';
import type { TimeRange } from '#components/ImagePicker/imagePickerTypes';
import type { CoverEditorTemplateList_profile$key } from '#relayArtifacts/CoverEditorTemplateList_profile.graphql';
import type { CoverEditorTemplateList_templates$key } from '#relayArtifacts/CoverEditorTemplateList_templates.graphql';
import type { CoverEditorTemplateList_templatesOthers$key } from '#relayArtifacts/CoverEditorTemplateList_templatesOthers.graphql';
import type { CoverEditorTemplateList_templatesPeople$key } from '#relayArtifacts/CoverEditorTemplateList_templatesPeople.graphql';
import type { CoverEditorTemplateList_templatesVideos$key } from '#relayArtifacts/CoverEditorTemplateList_templatesVideos.graphql';
import type {
  CoverEditorTemplateListItem_coverTemplate$key,
  CoverTemplateKind,
} from '#relayArtifacts/CoverEditorTemplateListItem_coverTemplate.graphql';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';
import type { CoverStyleData, MediaInfos } from './coverEditorTypes';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ListRenderItemInfo, ViewStyle, ViewToken } from 'react-native';

export type CoverEditorProps = {
  profile: CoverEditorTemplateList_profile$key;
  templateKind: CoverTemplateKind;
  mediaInfos: MediaInfos | null;
  title: string | null;
  subTitle: string | null;
  cardColors: ColorPalette | null;
  currentCoverInfos: {
    mediaInfos: MediaInfos;
    style: CoverStyleData;
  } | null;
  timeRange: TimeRange | null;
  mediaComputing: boolean;
  width: number;
  height: number;
  initialSelectedIndex: number;
  videoPaused: boolean;

  onSelectedIndexChange: (index: number) => void;
  onSelectedItemChange: (template: {
    id: string;
    style: CoverStyleData;
    mediaInfos: MediaInfos;
  }) => void;
  onColorPaletteChange: (palette: ColorPalette) => void;
};

const CoverEditorTemplateList = ({
  profile: profileKey,
  templateKind = 'people',
  mediaInfos,
  timeRange,
  title,
  subTitle,
  width,
  height,
  currentCoverInfos,
  cardColors,
  mediaComputing,
  initialSelectedIndex,
  onSelectedItemChange,
  onColorPaletteChange,
  onSelectedIndexChange,
  videoPaused,
}: CoverEditorProps) => {
  const profile = useFragment(
    graphql`
      fragment CoverEditorTemplateList_profile on Profile {
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
        webCard {
          id
          webCardKind
        }
        ...CoverEditorTemplateList_templates
      }
    `,
    profileKey,
  );

  const { coverTemplates, loadNext, isLoadingNext, hasNext } =
    useCoverTemplates(profile, templateKind);

  const onEndTemplateReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  //in some case profile.colorPalette seems to be null (sentry crash
  const colorPalettes = useMemo(() => {
    return convertToNonNullArray(
      (profile?.colorPalettes?.edges ?? []).map(edge => edge?.node ?? null),
    );
  }, [profile?.colorPalettes?.edges]);

  const items = useMemo<TemplateListItem[]>(() => {
    const templates = convertToNonNullArray(
      (coverTemplates?.edges ?? []).map(edge => edge?.node ?? null),
    );
    const items = templates.map((item, index): TemplateListItem => {
      const {
        id,
        previewMedia,
        kind,
        data: {
          titleStyle,
          subTitleStyle,
          textOrientation,
          textPosition,
          textAnimation,
          background,
          backgroundColor,
          backgroundPatternColor,
          foreground,
          foregroundColor,
          mediaFilter,
          mediaParameters,
          mediaAnimation,
        },
        colorPalette,
      } = readInlineData(
        graphql`
          fragment CoverEditorTemplateListItem_coverTemplate on CoverTemplate
          @inline
          @argumentDefinitions(
            cappedPixelRatio: {
              type: "Float!"
              provider: "CappedPixelRatio.relayprovider"
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
              rawUri: uri(raw: true)
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
                kind
                uri
              }
              foregroundColor
              mediaFilter
              mediaParameters
              mediaAnimation
              subTitleStyle {
                color
                fontFamily
                fontSize
              }
              textOrientation
              textPosition
              textAnimation
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

      const [templateCropParameters, templateStyleParameter] =
        extractLayoutParameters(templateEditionParameters);

      let templateMediaInfos = mediaInfos;
      if (!templateMediaInfos) {
        const templateMedia = {
          id: previewMedia.id,
          uri: previewMedia.uri,
          rawUri: previewMedia.rawUri,
          kind: previewMedia.__typename === 'MediaImage' ? 'image' : 'video',
          width: previewMedia.width,
          height: previewMedia.height,
        } as const;

        let mediaCropParameters = templateCropParameters;

        if (
          !mediaCropParameters.cropData &&
          Math.abs(templateMedia.width / templateMedia.height - COVER_RATIO) >
            0.05
        ) {
          // if the media doesn't have the right ratio, and there is no cropData in the template
          // we compute the cropData to have the right ratio
          const cropData: EditionParameters['cropData'] =
            cropDataForAspectRatio(
              templateMedia.width,
              templateMedia.height,
              COVER_RATIO,
            );
          mediaCropParameters = {
            ...templateCropParameters,
            cropData,
          };
        }

        templateMediaInfos = {
          sourceMedia: templateMedia,
          mediaCropParameters,
          maskMedia: null,
        };
      }

      return {
        id,
        title,
        subTitle,
        mediaInfos: templateMediaInfos,
        style: {
          titleStyle,
          subTitleStyle,
          textOrientation: textOrientationOrDefault(textOrientation),
          textPosition: textPositionOrDefault(textPosition),
          textAnimation,
          mediaFilter,
          mediaParameters: templateStyleParameter,
          mediaAnimation: mediaAnimation ?? null,
          background: background ?? null,
          backgroundColor,
          backgroundPatternColor,
          foreground: foreground ?? null,
          foregroundColor,
          segmented: kind === 'people' && !!templateMediaInfos?.maskMedia?.uri,
        },
        colorPalettes: templateColorPalettes,
      };
    });
    if (currentCoverInfos) {
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

      items.unshift({
        id: CURRENT_COVER_ID,
        title,
        subTitle,
        ...currentCoverInfos,
        colorPalettes: coverColorPalettes,
      });
    }

    return items;
  }, [
    coverTemplates?.edges,
    currentCoverInfos,
    colorPalettes,
    cardColors,
    mediaInfos,
    title,
    subTitle,
  ]);

  const [selectedItem, setSelectedItem] = useState<TemplateListItem | null>(
    items[0] ?? null,
  );
  useEffect(() => {
    //refreshing the selectedItem when switching between templateKind
    //fix: https://github.com/AzzappApp/azzapp/issues/1458
    setSelectedItem(items[initialSelectedIndex] ?? null);
  }, [initialSelectedIndex, items]);

  const [colorPalettesIndexes, setColorPalettesIndexes] = useState<
    Record<string, number>
  >({ cover: cardColors ? -1 : 0 });

  const carouselRef = useRef<CarouselSelectListHandle>(null);
  const colorPalettesListRef = useRef<FlatList<ColorPalette> | null>(null);
  const onSelectedIndexChangeInner = useCallback(
    (index: number) => {
      onSelectedIndexChange?.(index);
      const selectedItem = items[index];
      setSelectedItem(selectedItem);
      const colorPaletteIndex = colorPalettesIndexes[selectedItem.id] ?? 0;
      if (colorPaletteIndex !== -1) {
        colorPalettesListRef.current?.scrollToIndex({
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
    onSelectedItemChange(selectedItem);
  }, [onSelectedItemChange, selectedItem, templateKind]);

  const selectedItemId = useMemo(() => selectedItem?.id, [selectedItem?.id]);

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
    colorPalettesListRef.current?.scrollToIndex({
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
  const { width: windowWidth } = useWindowDimensions();

  const styles = useStyleSheet(styleSheet);

  const renderTemplate = useCallback(
    ({ item, index }: ListRenderItemInfo<TemplateListItem>) => {
      const isSelectedItem = item.id === selectedItemId;
      const onPress = () => {
        if (isSelectedItem) {
          onNextColorPalette();
        } else {
          scrollToIndex(index);
        }
      };

      return (
        <CoverEditorTemplateRenderer
          item={item}
          isSelectedItem={isSelectedItem}
          onPress={onPress}
          colorPalettesIndexes={colorPalettesIndexes}
          mediaComputing={mediaComputing}
          width={templateWidth}
          videoPaused={videoPaused}
          cardColors={cardColors}
          timeRange={timeRange}
          templateKind={templateKind}
        />
      );
    },
    [
      selectedItemId,
      colorPalettesIndexes,
      mediaComputing,
      templateWidth,
      videoPaused,
      cardColors,
      timeRange,
      templateKind,
      onNextColorPalette,
      scrollToIndex,
    ],
  );

  const renderTriptych = useCallback(
    ({ item, index }: Omit<ListRenderItemInfo<ColorPalette>, 'separators'>) => {
      const currentColorPaletteIndex = selectedItemId
        ? colorPalettesIndexes[selectedItemId] ?? 0
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
      selectedItemId,
      styles.colorPaletteContainer,
      styles.colorPaletteSelected,
    ],
  );

  const Carousel =
    Platform.OS === 'ios' ? CarouselSelectList : SimpleCarouselSelectList;

  return (
    <>
      <Carousel
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
        onEndReachedThreshold={1}
        extraData={selectedItemId}
      />
      {isLoadingNext && (
        <View
          style={{
            position: 'absolute',
            height: carouselHeight,
            width: windowWidth / 4,
            right: (width - windowWidth) / 2,
            top: 0,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: -1,
          }}
        >
          <ActivityIndicator />
        </View>
      )}
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
            {renderTriptych({ item: cardColors!, index: -1 })}
            <View style={styles.separator} />
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
            ref={colorPalettesListRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{
              height: PALETTE_LIST_HEIGHT,
              flex: 1,
            }}
            data={selectedItem?.colorPalettes ?? []}
            keyExtractor={paletteKeyExtract}
            renderItem={renderTriptych}
            contentContainerStyle={styles.colorPaletteListContainer}
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
  profileKey: CoverEditorTemplateList_templates$key,
  kind: string,
) => {
  const profile = useFragment(
    graphql`
      fragment CoverEditorTemplateList_templates on Profile {
        ...CoverEditorTemplateList_templatesPeople
        ...CoverEditorTemplateList_templatesVideos
        ...CoverEditorTemplateList_templatesOthers
      }
    `,
    profileKey,
  );

  const peopleFragmentResult = usePaginationFragment(
    graphql`
      fragment CoverEditorTemplateList_templatesPeople on Profile
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
    profile as CoverEditorTemplateList_templatesPeople$key,
  );

  const videosFragmentResult = usePaginationFragment(
    graphql`
      fragment CoverEditorTemplateList_templatesVideos on Profile
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
    profile as CoverEditorTemplateList_templatesVideos$key,
  );

  const othersFragmentResult = usePaginationFragment(
    graphql`
      fragment CoverEditorTemplateList_templatesOthers on Profile
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
    profile as CoverEditorTemplateList_templatesOthers$key,
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

const CoverEditorTemplateRenderer = ({
  item,
  isSelectedItem,
  colorPalettesIndexes,
  width,
  onPress,
  timeRange,
  cardColors,
  mediaComputing,
  videoPaused,
  templateKind,
}: {
  item: TemplateListItem;
  timeRange: TimeRange | null;
  isSelectedItem: boolean;
  colorPalettesIndexes: Record<string, number>;
  cardColors: ColorPalette | null;
  mediaComputing: boolean;
  width: number;
  videoPaused: boolean;
  templateKind: CoverTemplateKind;
  onPress: () => void;
}) => {
  const hasFocus = useScreenHasFocus();
  const { mediaInfos, style } = item;
  const { uri, kind } = mediaInfos.sourceMedia;
  const colorPaletteIndex = colorPalettesIndexes[item.id] ?? 0;

  const [loading, setLoading] = useState(true);
  const [loadingFailed, setLoadingFailed] = useState(false);

  const loadingTimeout = useRef<any>(null);
  const onStartLoading = useCallback(() => {
    loadingTimeout.current = setTimeout(() => {
      setLoading(true);
    }, 50);
  }, []);

  const onLoad = useCallback(() => {
    clearTimeout(loadingTimeout.current);
    setLoading(false);
    setLoadingFailed(false);
  }, []);

  const onError = useCallback(() => {
    clearTimeout(loadingTimeout.current);
    setLoading(false);
    setLoadingFailed(true);
  }, []);

  const onRetry = useCallback(() => {
    setLoadingFailed(false);
    setLoading(true);
  }, []);

  const styles = useStyleSheet(styleSheet);

  const borderRadius = COVER_CARD_RADIUS * width;

  const editionParameters = useMemo(() => {
    const { sourceMedia } = mediaInfos;
    let { mediaCropParameters } = mediaInfos;
    if (sourceMedia.rawUri && mediaCropParameters?.cropData) {
      const { originX, originY, width, height } = mediaCropParameters.cropData;
      const scale = (256 * Math.min(2, PixelRatio.get())) / sourceMedia.width;
      mediaCropParameters = {
        ...mediaCropParameters,
        cropData: {
          originX: originX * scale,
          originY: originY * scale,
          width: width * scale,
          height: height * scale,
        },
      };
    }
    return {
      ...style.mediaParameters,
      ...mediaCropParameters,
    };
  }, [mediaInfos, style]);

  const coverPreviewRendererStyle = useMemo(
    () => [styles.templateItemContainer, { borderRadius }],
    [styles.templateItemContainer, borderRadius],
  );

  return (
    <PressableScaleHighlight
      style={{
        overflow: Platform.select({ default: 'visible', android: 'hidden' }),
        borderRadius,
      }}
      onPress={loading || loadingFailed ? null : onPress}
      disabled={loading || loadingFailed}
      disabledOpacity={1}
    >
      {loadingFailed ? (
        <CoverErrorRenderer
          label={
            <FormattedMessage
              defaultMessage="An error occurred while loading this template"
              description="Error message displayed when a template failed to load in CoverEditor"
            />
          }
          width={width}
          onRetry={onRetry}
        />
      ) : (
        <CoverPreviewRendererMemo
          uri={uri}
          kind={kind}
          maskUri={templateKind === 'people' ? mediaInfos.maskMedia?.uri : null}
          startTime={timeRange?.startTime}
          duration={timeRange?.duration}
          backgroundColor={style.backgroundColor}
          backgroundId={style.background?.id}
          backgroundImageUri={style.background?.uri}
          backgroundImageTintColor={style.backgroundPatternColor}
          foregroundId={style.foreground?.id}
          foregroundKind={style.foreground?.kind}
          foregroundImageUri={style.foreground?.uri}
          foregroundImageTintColor={style.foregroundColor}
          editionParameters={editionParameters}
          filter={style.mediaFilter}
          mediaAnimation={style.mediaAnimation}
          title={item.title}
          titleStyle={style.titleStyle}
          subTitle={item.subTitle}
          subTitleStyle={style.subTitleStyle}
          textOrientation={style.textOrientation}
          textPosition={style.textPosition}
          textAnimation={style.textAnimation}
          colorPalette={
            colorPaletteIndex === -1
              ? cardColors!
              : item.colorPalettes[colorPaletteIndex]
          }
          width={width}
          videoPreview={Platform.OS !== 'android'}
          videoDisabled={
            !isSelectedItem || (Platform.OS === 'android' && !hasFocus)
          }
          paused={videoPaused || mediaComputing}
          style={coverPreviewRendererStyle}
          onStartLoading={onStartLoading}
          onLoad={onLoad}
          onError={onError}
        />
      )}
      {loading && (
        <CoverLoadingIndicator width={width} style={StyleSheet.absoluteFill} />
      )}
    </PressableScaleHighlight>
  );
};

const CoverPreviewRendererMemo = memo(
  CoverPreviewRenderer,
  (prevProps, nextProps) => isEqual(prevProps, nextProps),
);

const computeTemplatesPalettes = (
  itemIndex: number,
  colorPaletteIndex: number,
  colorPalette: ColorPalette | null,
  colorPalettes: ColorPalette[],
  currentColorPalette: ColorPalette | null,
) => {
  let result = colorPalettes.slice();
  if (colorPaletteIndex !== -1) {
    result.splice(colorPaletteIndex, 1);
  }
  result = shuffle(result, itemIndex);
  if (colorPalette !== null) {
    result.unshift(colorPalette);
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

export const CURRENT_COVER_ID = 'cover';

const templateKeyExtractor = (item: TemplateListItem) => item.id;

const paletteKeyExtract = (item: ColorPalette & { id?: string }) =>
  item.id ?? CURRENT_COVER_ID;

type TemplateListItem = {
  id: string;
  mediaInfos: MediaInfos;
  title: string | null;
  subTitle: string | null;
  style: CoverStyleData;
  colorPalettes: Array<ColorPalette & { id?: string }>;
};

const PALETTE_LIST_HEIGHT = 30;
const GAP = 16;

const styleSheet = createStyleSheet(appearance => ({
  carousel: { flexGrow: 0, overflow: 'visible', alignSelf: 'center' },
  carouselContentContainer: { flexGrow: 0, overflow: 'visible' },
  templateItemContainer: {
    backgroundColor: appearance === 'light' ? '#fff' : '#000',
    ...Platform.select<ViewStyle>({
      default: shadow(appearance, 'center'),
      android: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: appearance === 'dark' ? colors.grey800 : colors.grey100,
        overflow: 'hidden',
        elevation: 0,
      },
    }),
  },
  colorPaletteListContainer: {
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
  separator: {
    width: 5,
    height: 5,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    borderRadius: 5,
    marginLeft: GAP,
  },
}));
