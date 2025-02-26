import { type ReactNode } from 'react';
import { Animated as RNAnimated, StyleSheet, View } from 'react-native';
import useIsModuleItemInViewPort from '#hooks/useIsModuleItemInViewPort';
import CardModuleMediaSelector from './CardModuleMediaSelector';
import type {
  CardModuleDimension,
  CardModuleSourceMedia,
} from './cardModuleEditorType';

type ParallaxContainerProps = {
  media: CardModuleSourceMedia;
  index: number;
  scrollY: RNAnimated.Value;
  dimension: CardModuleDimension;
  canPlay: boolean;
  disableParallax: boolean;
  modulePosition?: number;
  children?: ReactNode | undefined;
  webCardViewMode?: 'edit' | 'view';
};

const PARALLAX_RATIO = 0.8;

const ParallaxContainer = ({
  media,
  dimension,
  canPlay,
  index,
  scrollY,
  modulePosition,
  disableParallax,
  webCardViewMode,
  children,
}: ParallaxContainerProps) => {
  const itemStartY = (modulePosition ?? 0) + index * dimension.height;
  const itemEndY = itemStartY + dimension.height;

  const inViewport = useIsModuleItemInViewPort(
    scrollY,
    itemStartY,
    dimension.height,
    true,
    webCardViewMode === 'edit',
    dimension,
  );

  return (
    <View style={[styles.container, dimension]}>
      <RNAnimated.View
        style={[
          {
            width: dimension.width,
            height: dimension.height,
          },
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
        <CardModuleMediaSelector
          media={media}
          dimension={dimension}
          canPlay={canPlay && inViewport}
          priority={inViewport ? 'high' : 'normal'}
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
