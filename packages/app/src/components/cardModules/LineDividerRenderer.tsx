import { useState, useCallback, useMemo } from 'react';
import {
  type ViewProps,
  type LayoutChangeEvent,
  type LayoutRectangle,
  View,
} from 'react-native';
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

export type LineDividerRendererData = NullableFields<
  Omit<LineDividerRenderer_module$data, ' $fragmentType'>
>;

export type LineDividerRendererProps = ViewProps & {
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
  /**
   * the data for the module
   */
  data: LineDividerRendererData;
};
/**
 * Render a LineDivider module
 */
const LineDividerRenderer = ({
  data,
  colorPalette,
  cardStyle,
  style,
  ...props
}: LineDividerRendererProps) => {
  const {
    orientation,
    colorTop,
    colorBottom,
    height,
    marginBottom,
    marginTop,
  } = getModuleDataValues({
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

  const containerStyle = useMemo(() => {
    return {
      height: height + (marginBottom ?? 0) + (marginTop ?? 0),
    } as const;
  }, [height, marginBottom, marginTop]);

  const elementTop = useMemo(() => {
    return {
      height: marginTop,
      display: marginTop ? 'flex' : 'none',
    } as const;
  }, [marginTop]);

  const elementBottom = useMemo(() => {
    return {
      height: marginBottom,
      display: marginBottom ? 'flex' : 'none',
    } as const;
  }, [marginBottom]);

  const dividerStyle = useMemo(() => {
    return {
      height: height + 2,
      maxHeight: height + 2,
      marginTop: -1,
      marginBottom: -1,
      zIndex: 1,
      borderTopWidth: height,
    };
  }, [height]);

  return (
    <View {...props} style={[containerStyle, style]} onLayout={onLayout}>
      <View
        style={[
          elementTop,
          {
            backgroundColor: swapColor(colorTop, colorPalette),
          },
        ]}
      />

      <View
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

      <View
        style={[
          elementBottom,
          { backgroundColor: swapColor(colorBottom, colorPalette) },
        ]}
      />
    </View>
  );
};

export default LineDividerRenderer;
