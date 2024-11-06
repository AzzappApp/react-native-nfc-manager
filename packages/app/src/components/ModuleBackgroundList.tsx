import chroma from 'chroma-js';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import {
  COVER_ANIMATION_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { keyExtractor } from '#helpers/idHelpers';
import BoxSelectionList from './BoxSelectionList';
import CardModuleBackgroundImage from './cardModules/CardModuleBackgroundImage';
import type {
  ModuleBackgroundList_ModuleBackgrounds$data,
  ModuleBackgroundList_ModuleBackgrounds$key,
} from '#relayArtifacts/ModuleBackgroundList_ModuleBackgrounds.graphql';
import type { BoxButtonItemInfo } from './BoxSelectionList';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ColorValue, ViewProps } from 'react-native';

type ModuleBackgroundListProps = ViewProps & {
  /**
   * The list of static medias to display.
   */
  medias: ModuleBackgroundList_ModuleBackgrounds$key;
  /**
   * the id of the currently selected media.
   */
  selectedMedia: string | null | undefined;
  /**
   * the background color of the displayed medias.
   */
  backgroundColor?: ColorValue;
  /**
   * the tint color of the displayed medias.
   */
  tintColor?: ColorValue;
  /**
   * the aspect ratio of the media buttons.
   */
  imageRatio?: number;
  /**
   * a callback called when the user select a media.
   * @param media the id of the selected media.
   */
  onSelectMedia: (media: string | null) => void;
};

/**
 * Displays a list of static medias and let the user select one.
 */
const ModuleBackgroundList = ({
  medias: mediasKey,
  selectedMedia,
  onSelectMedia,
  backgroundColor = '#FFFFFF',
  tintColor = '#000000',
  imageRatio = COVER_RATIO,
  testID = 'cover-media-list',
  style,
}: ModuleBackgroundListProps) => {
  const ModuleBackgrounds = useFragment(
    graphql`
      fragment ModuleBackgroundList_ModuleBackgrounds on ModuleBackground
      @relay(plural: true) {
        id
        uri
        resizeMode
      }
    `,
    mediasKey,
  );

  const visibleBackgroundColor = useMemo(() => {
    if (tintColor === backgroundColor) {
      const color = chroma(backgroundColor as string);
      if (color.luminance() > 0.5) {
        return chroma(backgroundColor as string)
          .darken(0.3)
          .hex();
      } else {
        return chroma(backgroundColor as string)
          .brighten(0.3)
          .hex();
      }
    }
    return backgroundColor;
  }, [backgroundColor, tintColor]);

  const animationSharedValue = useSharedValue(0);
  useEffect(() => {
    animationSharedValue.value = withRepeat(
      withTiming(1, {
        duration: COVER_ANIMATION_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [animationSharedValue]);

  const renderItem = useCallback(
    ({ item, height, width }: BoxButtonItemInfo<ModuleBackgroundItem>) => {
      return (
        <ModuleBackgroundListItemMemo
          item={item}
          imageRatio={imageRatio}
          backgroundColor={visibleBackgroundColor}
          tintColor={tintColor}
          height={height}
          width={width}
        />
      );
    },
    [visibleBackgroundColor, imageRatio, tintColor],
  );

  const onSelect = useCallback(
    (item: ModuleBackgroundItem | null) => {
      onSelectMedia(item?.id ?? null);
    },
    [onSelectMedia],
  );

  return (
    <BoxSelectionList
      data={ModuleBackgrounds}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      testID={testID}
      accessibilityRole="list"
      onSelect={onSelect}
      imageRatio={imageRatio}
      selectedItem={
        ModuleBackgrounds.find(item => item.id === selectedMedia) ?? null
      }
      style={style}
    />
  );
};

type ModuleBackgroundItem =
  ArrayItemType<ModuleBackgroundList_ModuleBackgrounds$data>;

export default ModuleBackgroundList;

type ModuleBackgroundListItemProps = {
  item: ArrayItemType<ModuleBackgroundList_ModuleBackgrounds$data> | null;
  imageRatio: number;
  backgroundColor: ColorValue;
  tintColor: ColorValue | string;
  width: number;
  height: number;
};

const ModuleBackgroundListItem = ({
  item,
  imageRatio,
  backgroundColor,
  tintColor,
  width,
  height,
}: ModuleBackgroundListItemProps) => {
  return (
    <View
      style={{
        flex: 1,
        aspectRatio: imageRatio,
        backgroundColor,
      }}
    >
      {item && (
        <CardModuleBackgroundImage
          layout={{
            width,
            height,
          }}
          resizeMode={item.resizeMode}
          backgroundUri={item.uri}
          patternColor={tintColor}
          backgroundOpacity={1}
        />
      )}
    </View>
  );
};

const ModuleBackgroundListItemMemo = memo(ModuleBackgroundListItem);
