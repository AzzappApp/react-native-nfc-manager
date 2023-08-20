import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  LINE_DIVIDER_DEFAULT_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import type {
  LineDividerRenderer_module$data,
  LineDividerRenderer_module$key,
} from '@azzapp/relay/artifacts/LineDividerRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type {
  ViewProps,
  LayoutChangeEvent,
  LayoutRectangle,
} from 'react-native';

export type LineDividerRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a line divider module
   */
  module: LineDividerRenderer_module$key;
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
 * Render a line divider module
 */
const LineDividerRenderer = ({
  module,
  ...props
}: LineDividerRendererProps) => {
  const data = useFragment(
    graphql`
      fragment LineDividerRenderer_module on CardModuleLineDivider {
        orientation
        marginBottom
        marginTop
        height
        colorTop
        colorBottom
      }
    `,
    module,
  );
  return <LineDividerRendererRaw data={data} {...props} />;
};

export default LineDividerRenderer;

export type LineDividerRawData = NullableFields<
  Omit<LineDividerRenderer_module$data, ' $fragmentType'>
>;

type LineDividerRendererRawProps = ViewProps & {
  /**
   * The data for the line divider module
   */
  data: LineDividerRawData;
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
 * Raw implementation of the line divider module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const LineDividerRendererRaw = ({
  data,
  colorPalette,
  cardStyle,
  style,
  ...props
}: LineDividerRendererRawProps) => {
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
        <View style={{ height: marginTop, backgroundColor: colorTop }} />
      )}
      <View
        style={{
          height,
          maxHeight: height,
          borderRightWidth: orientation === 'bottomRight' ? layout?.width : 0,
          borderLeftWidth: orientation !== 'bottomRight' ? layout?.width : 0,
          borderRightColor: swapColor(colorBottom, colorPalette),
          borderLeftColor: swapColor(colorBottom, colorPalette),
          borderTopWidth: height,
          borderTopColor: swapColor(colorTop, colorPalette),
        }}
      />
      {marginBottom > 0 && (
        <View
          style={{
            height: marginBottom,
            backgroundColor: swapColor(colorBottom, colorPalette),
          }}
        />
      )}
    </View>
  );
};
