import { useState, useCallback } from 'react';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  LINE_DIVIDER_DEFAULT_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import type {
  LineDividerRenderer_module$data,
  LineDividerRenderer_module$key,
} from '#relayArtifacts/LineDividerRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type {
  ViewProps,
  LayoutChangeEvent,
  LayoutRectangle,
} from 'react-native';

const LineDividerRendererFragment = graphql`
  fragment LineDividerRenderer_module on CardModuleLineDivider @inline {
    orientation
    marginBottom
    marginTop
    height
    colorTop
    colorBottom
  }
`;

export const readLineDividerData = (module: LineDividerRenderer_module$key) =>
  readInlineData(LineDividerRendererFragment, module);

type AnimatedProps = 'height' | 'marginBottom' | 'marginTop';

export type LineDividerRendererData = NullableFields<
  Omit<LineDividerRenderer_module$data, ' $fragmentType'>
>;

type LineDividerRendererAnimatedData = {
  [K in AnimatedProps]: SharedValue<NonNullable<LineDividerRendererData[K]>>;
};

export type LineDividerRendererProps = ViewProps & {
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
} & (
    | {
        /**
         * The data for the line divider module
         */
        data: LineDividerRendererData;
        animatedData: null;
      }
    | {
        /**
         * The data for the line divider module
         */
        data: Omit<LineDividerRendererData, AnimatedProps>;
        /**
         * The animated data for the line divider module
         */
        animatedData: LineDividerRendererAnimatedData;
      }
  );

/**
 * Render a LineDivider module
 */
const LineDividerRenderer = ({
  data,
  colorPalette,
  cardStyle,
  style,
  animatedData,
  ...props
}: LineDividerRendererProps) => {
  const { orientation, colorTop, colorBottom, ...rest } = getModuleDataValues({
    data,
    cardStyle,
    defaultValues: LINE_DIVIDER_DEFAULT_VALUES,
    styleValuesMap: null,
  });

  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      props.onLayout?.(e);
      setLayout(e.nativeEvent.layout);
    },
    [props],
  );

  const containerStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('height' in rest) {
        return {
          height:
            (rest.height ?? 0) +
            (rest.marginBottom ?? 0) +
            (rest.marginTop ?? 0),
        };
      }
      return {};
    }

    return {
      height:
        (animatedData.height.value ?? 0) +
        (animatedData.marginBottom.value ?? 0) +
        (animatedData.marginTop.value ?? 0),
    };
  });

  const elementTop = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('marginTop' in rest) {
        return {
          height: rest.marginTop ?? 0,
          display: rest.marginTop ? 'flex' : 'none',
        };
      }
      return {};
    }
    return {
      height: (animatedData.marginTop.value ?? 0) + 1,
      display: animatedData.marginTop.value ? 'flex' : 'none',
    };
  });

  const elementBottom = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('marginBottom' in rest) {
        return {
          height: rest.marginBottom ?? 0,
          display: rest.marginBottom ? 'flex' : 'none',
        };
      }
      return {};
    }
    return {
      height: (animatedData.marginBottom.value ?? 0) + 1,
      display: animatedData.marginBottom.value ? 'flex' : 'none',
    };
  });

  const dividerStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('height' in rest) {
        return {
          height: (rest.height ?? 0) + 2,
          maxHeight: (rest.height ?? 0) + 2,
          marginTop: -1,
          marginBottom: -1,
          zIndex: 1,
          borderTopWidth: rest.height ?? 0,
        };
      }
      return {};
    }

    const height = animatedData.height.value ?? 0;

    return {
      height: height + 2,
      maxHeight: height + 2,
      marginTop: -1,
      marginBottom: -1,
      zIndex: 1,
      borderTopWidth: height,
    };
  });

  return (
    <Animated.View
      {...props}
      style={[containerStyle, style]}
      onLayout={onLayout}
    >
      <Animated.View
        style={[
          elementTop,
          {
            backgroundColor: swapColor(colorTop, colorPalette),
          },
        ]}
      />

      <Animated.View
        style={[
          dividerStyle,
          {
            borderRightWidth: orientation === 'bottomRight' ? layout?.width : 0,
            borderLeftWidth: orientation !== 'bottomRight' ? layout?.width : 0,
            borderRightColor: swapColor(colorBottom, colorPalette),
            borderLeftColor: swapColor(colorBottom, colorPalette),
            borderTopColor: swapColor(colorTop, colorPalette),
          },
        ]}
      />

      <Animated.View
        style={[
          elementBottom,
          {
            backgroundColor: swapColor(colorBottom, colorPalette),
          },
        ]}
      />
    </Animated.View>
  );
};

export default LineDividerRenderer;
