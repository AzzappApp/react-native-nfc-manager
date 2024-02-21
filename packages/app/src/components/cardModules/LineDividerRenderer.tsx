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

const animatedProps = ['height', 'marginBottom', 'marginTop'] as const;

type AnimatedProps = (typeof animatedProps)[number];

export type LineDividerRendererViewData = Omit<
  LineDividerRenderer_module$data,
  ' $fragmentType'
>;

export type LineDividerRendererData = NullableFields<
  Omit<LineDividerRendererViewData, AnimatedProps>
>;

export type LineDividerViewRendererProps = Omit<
  LineDividerRendererProps,
  'animatedData' | 'data'
> & {
  data: LineDividerRendererViewData;
};

type LineDividerRendererAnimatedData = {
  [K in AnimatedProps]:
    | LineDividerRendererViewData[K]
    | SharedValue<LineDividerRendererViewData[K]>;
};

export type LineDividerRendererProps = ViewProps & {
  /**
   * The data for the line divider module
   */
  data: LineDividerRendererData;
  /**
   * The animated data for the line divider module
   */
  animatedData: LineDividerRendererAnimatedData;
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
};

export const LineDividerViewRenderer = ({
  data,
  ...rest
}: LineDividerViewRendererProps) => {
  const { height, marginTop, marginBottom, ...restData } = data;

  return (
    <LineDividerRenderer
      {...rest}
      data={restData}
      animatedData={{
        height,
        marginTop,
        marginBottom,
      }}
    />
  );
};

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
  const { orientation, colorTop, colorBottom } = getModuleDataValues({
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

  const { height, marginTop, marginBottom } = animatedData;

  const containerStyle = useAnimatedStyle(() => {
    const heightValue =
      typeof height === 'number' ? height : height?.value ?? 0;
    const marginBottomValue =
      typeof marginBottom === 'number'
        ? marginBottom
        : marginBottom?.value ?? 0;
    const marginTopValue =
      typeof marginTop === 'number' ? marginTop : marginTop?.value ?? 0;
    return {
      height: heightValue + marginBottomValue + marginTopValue,
    };
  });

  const elementTop = useAnimatedStyle(() => {
    const marginTopValue =
      typeof marginTop === 'number' ? marginTop : marginTop?.value ?? 0;
    return {
      height: marginTopValue + 1,
      display: marginTopValue > 0 ? 'flex' : 'none',
    };
  }, [marginTop]);

  const elementBottom = useAnimatedStyle(() => {
    const marginBottomValue =
      typeof marginBottom === 'number'
        ? marginBottom
        : marginBottom?.value ?? 0;
    return {
      height: marginBottomValue + 1,
      display: marginBottomValue > 0 ? 'flex' : 'none',
    };
  }, [marginBottom]);

  const dividerStyle = useAnimatedStyle(() => {
    const heightValue =
      typeof height === 'number' ? height : height?.value ?? 0;
    return {
      height: heightValue + 2,
      maxHeight: heightValue + 2,
      marginTop: -1,
      marginBottom: -1,
      zIndex: 1,
      borderTopWidth: heightValue,
    };
  }, [height]);

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
