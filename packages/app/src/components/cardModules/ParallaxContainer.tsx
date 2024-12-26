import { type ReactNode } from 'react';
import { Animated as RNAnimated, StyleSheet, View } from 'react-native';
import { useIsCardModuleEdition } from './CardModuleEditionContext';
import CardModuleMediaEditPreview from './CardModuleMediaEditPreview';
import CardModuleMediaItem from './CardModuleMediaItem';
import type {
  CardModuleDimension,
  CardModuleSourceMedia,
} from './cardModuleEditorType';
import type { ViewStyle } from 'react-native';

type ParallaxContainerProps = {
  media: CardModuleSourceMedia;
  index: number;
  scrollY: RNAnimated.Value;
  dimension: CardModuleDimension;
  disableParallax?: boolean;
  modulePosition?: number;
  children?: ReactNode | undefined;
  imageStyle?: ViewStyle; // some variant need opacity and backgroundcolor (mediaText) but not other (media)
  imageContainerStyle?: ViewStyle; // some variant need opacity and backgroundcolor (mediaText) but not other (media)
};

const PARALLAX_RATIO = 0.8;

const ParallaxContainer = ({
  media,
  dimension,
  index,
  scrollY,
  modulePosition,
  disableParallax,
  children,
  imageStyle,
  imageContainerStyle,
}: ParallaxContainerProps) => {
  const itemStartY = (modulePosition ?? 0) + index * dimension.height;
  const itemEndY = itemStartY + dimension.height;
  const MediaItemRenderer = useIsCardModuleEdition()
    ? CardModuleMediaEditPreview
    : CardModuleMediaItem;
  return (
    <View style={[styles.container, dimension]}>
      <RNAnimated.View
        style={[
          {
            width: dimension.width,
            height: dimension.height,
          },
          imageContainerStyle,
          {
            transform: [
              {
                translateY: disableParallax
                  ? 0
                  : scrollY.interpolate({
                      inputRange: [
                        itemStartY - dimension.height,
                        itemStartY,
                        itemEndY,
                      ],
                      outputRange: [
                        -dimension.height * PARALLAX_RATIO,
                        0,
                        dimension.height * PARALLAX_RATIO,
                      ],
                    }),
              },
            ],
          },
        ]}
      >
        <MediaItemRenderer
          media={media}
          dimension={dimension}
          imageStyle={{
            width: dimension.width,
            height: dimension.height,
            ...imageStyle,
          }}
        />
      </RNAnimated.View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default ParallaxContainer;
