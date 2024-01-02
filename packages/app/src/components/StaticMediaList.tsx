import chroma from 'chroma-js';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import {
  COVER_ANIMATION_DURATION,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import BoxSelectionList from './BoxSelectionList';
import CardModuleBackgroundImage from './cardModules/CardModuleBackgroundImage';
import CoverLottiePlayer from './CoverRenderer/CoverLottiePlayer';
import type { BoxButtonItemInfo } from './BoxSelectionList';
import type {
  StaticMediaList_staticMedias$data,
  StaticMediaList_staticMedias$key,
} from '@azzapp/relay/artifacts/StaticMediaList_staticMedias.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ColorValue } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type StaticMediaListProps = ViewProps & {
  /**
   * The list of static medias to display.
   */
  medias: StaticMediaList_staticMedias$key;
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
const StaticMediaList = ({
  medias: mediasKey,
  selectedMedia,
  onSelectMedia,
  backgroundColor = '#FFFFFF',
  tintColor = '#000000',
  imageRatio = COVER_RATIO,
  testID = 'cover-media-list',
  style,
}: StaticMediaListProps) => {
  const staticMedias = useFragment(
    graphql`
      fragment StaticMediaList_staticMedias on StaticMedia
      @relay(plural: true) {
        id
        kind
        # we use arbitrary values here, but it should be good enough
        smallURI: uri(width: 125, pixelRatio: 2)
        resizeMode
      }
    `,
    mediasKey,
  );

  const visiblebackgroundColor = useMemo(() => {
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
    ({ item, height, width }: BoxButtonItemInfo<StaticMediaItem>) => {
      if (item) {
        return (
          <StaticMediaListItemMemo
            item={item}
            imageRatio={imageRatio}
            resizeMode={item.resizeMode}
            kind={item.kind}
            backgroundColor={visiblebackgroundColor}
            tintColor={tintColor}
            height={height}
            width={width}
            animationSharedValue={animationSharedValue}
          />
        );
      }
      return null;
    },
    [visiblebackgroundColor, imageRatio, tintColor, animationSharedValue],
  );

  const onSelect = useCallback(
    (item: StaticMediaItem | null) => {
      onSelectMedia(item?.id ?? null);
    },
    [onSelectMedia],
  );

  return (
    <BoxSelectionList
      data={staticMedias}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      testID={testID}
      accessibilityRole="list"
      onSelect={onSelect}
      imageRatio={imageRatio}
      selectedItem={
        staticMedias.find(item => item.id === selectedMedia) ?? null
      }
      style={style}
    />
  );
};

type StaticMediaItem = ArrayItemType<StaticMediaList_staticMedias$data>;

const keyExtractor = (item: StaticMediaItem) => item.id;

export default StaticMediaList;

type StaticMediaListItemProps = {
  item: ArrayItemType<StaticMediaList_staticMedias$data> | null;
  imageRatio: number;
  backgroundColor: ColorValue;
  tintColor: ColorValue | string;
  width: number;
  height: number;
  /**
   *
   *
   * @type {('center' | 'contain' | 'cover' | 'repeat' | 'stretch' | null)}
   */
  resizeMode: string | null;
  animationSharedValue: SharedValue<number>;
  kind: string;
};

const StaticMediaListItem = ({
  item,
  imageRatio,
  backgroundColor,
  tintColor,
  resizeMode,
  kind,
  width,
  height,
  animationSharedValue,
}: StaticMediaListItemProps) => {
  const animationProps = useAnimatedProps(() => {
    return {
      progress: animationSharedValue.value,
    };
  }, [animationSharedValue]);

  return item?.smallURI ? (
    <View
      style={[
        {
          borderRadius: width * COVER_CARD_RADIUS,
          overflow: 'hidden',
          aspectRatio: imageRatio,
        },
      ]}
    >
      {kind === 'svg' ? (
        <CardModuleBackgroundImage
          layout={{
            width,
            height,
          }}
          resizeMode={resizeMode}
          backgroundUri={item.smallURI}
          patternColor={tintColor}
          backgroundOpacity={1}
        />
      ) : kind === 'lottie' ? (
        <CoverLottiePlayer
          src={item.smallURI}
          tintColor={tintColor as string}
          animatedProps={animationProps}
          hardwareAccelerationAndroid
          style={[
            styles.image,
            {
              backgroundColor,
              aspectRatio: imageRatio,
            },
          ]}
        />
      ) : (
        <Image
          source={{ uri: item?.smallURI }}
          style={[
            styles.image,
            {
              backgroundColor,
              tintColor,
              aspectRatio: imageRatio,
            },
          ]}
        />
      )}
    </View>
  ) : (
    <View
      style={[
        styles.image,
        styles.nullImage,
        {
          borderRadius: width * COVER_CARD_RADIUS,
          backgroundColor,
          aspectRatio: imageRatio,
        },
      ]}
    />
  );
};

const StaticMediaListItemMemo = memo(StaticMediaListItem);

const styles = StyleSheet.create({
  image: {
    height: '100%',
  },
  nullImage: {
    borderWidth: 2,
    borderColor: colors.black,
  },
});
