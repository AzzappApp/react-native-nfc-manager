import { useState, useCallback } from 'react';
import { View } from 'react-native';
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

export type LineDividerRendererData = NullableFields<
  Omit<LineDividerRenderer_module$data, ' $fragmentType'>
>;

type LineDividerRendererProps = ViewProps & {
  /**
   * The data for the line divider module
   */
  data: LineDividerRendererData;
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
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
    marginBottom,
    marginTop,
    height,
    colorTop,
    colorBottom,
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

  return (
    <View
      {...props}
      style={[{ height: height + marginBottom + marginTop }, style]}
      onLayout={onLayout}
    >
      {marginTop > 0 && (
        <View
          style={{
            height: marginTop + 1,
            backgroundColor: swapColor(colorTop, colorPalette),
          }}
        />
      )}
      <View
        style={{
          height: height + 2,
          maxHeight: height + 2,
          borderRightWidth: orientation === 'bottomRight' ? layout?.width : 0,
          borderLeftWidth: orientation !== 'bottomRight' ? layout?.width : 0,
          borderRightColor: swapColor(colorBottom, colorPalette),
          borderLeftColor: swapColor(colorBottom, colorPalette),
          borderTopWidth: height,
          borderTopColor: swapColor(colorTop, colorPalette),
          marginTop: -1,
          marginBottom: -1,
          zIndex: 1,
        }}
      />
      {marginBottom > 0 && (
        <View
          style={{
            height: marginBottom + 1,
            backgroundColor: swapColor(colorBottom, colorPalette),
          }}
        />
      )}
    </View>
  );
};

export default LineDividerRenderer;
