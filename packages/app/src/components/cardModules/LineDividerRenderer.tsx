import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { LINE_DIVIDER_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import type {
  LineDividerRenderer_module$data,
  LineDividerRenderer_module$key,
} from '@azzapp/relay/artifacts/LineDividerRenderer_module.graphql';
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
      fragment LineDividerRenderer_module on CardModule {
        ... on CardModuleLineDivider {
          orientation
          marginBottom
          marginTop
          height
          colorTop
          colorBottom
        }
      }
    `,
    module,
  );
  return <LineDividerRendererRaw data={data} {...props} />;
};

export default LineDividerRenderer;

export type LineDividerRawData = Omit<
  LineDividerRenderer_module$data,
  ' $fragmentType'
>;

type LineDividerRendererRawProps = ViewProps & {
  /**
   * The data for the line divider module
   */
  data: LineDividerRawData;
};

/**
 * Raw implementation of the line divider module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const LineDividerRendererRaw = ({
  data,
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
  } = Object.assign({}, LINE_DIVIDER_DEFAULT_VALUES, data);

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
          borderRightColor: colorBottom,
          borderLeftColor: colorBottom,
          borderTopWidth: height,
          borderTopColor: colorTop,
        }}
      />
      {marginBottom > 0 && (
        <View style={{ height: marginBottom, backgroundColor: colorBottom }} />
      )}
    </View>
  );
};
