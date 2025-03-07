import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  LINE_DIVIDER_DEFAULT_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import type { ModuleRendererProps } from './ModuleRenderer';
import type { CardModuleLineDivider } from '@azzapp/data';

export type LineDividerRendererProps =
  ModuleRendererProps<CardModuleLineDivider> &
    Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

/**
 * Render a line divider module
 */
const LineDividerRenderer = ({
  module,
  cardStyle,
  colorPalette,
  resizeModes: _,
  style,
  ...props
}: LineDividerRendererProps) => {
  const {
    orientation,
    marginBottom,
    marginTop,
    height,
    colorTop: rawColorTop,
    colorBottom: rawColorBottom,
  } = getModuleDataValues({
    data: module.data,
    cardStyle,
    styleValuesMap: {},
    defaultValues: LINE_DIVIDER_DEFAULT_VALUES,
  });

  const colorTop = swapColor(rawColorTop, colorPalette);
  const colorBottom = swapColor(rawColorBottom, colorPalette);

  const cssOrientation =
    orientation === 'bottomRight' ? 'to bottom right' : 'to bottom left';
  return (
    <div
      {...props}
      style={{
        ...style,
        height: height + marginBottom + marginTop,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="separator"
    >
      {marginTop > 0 && (
        <div style={{ height: marginTop, backgroundColor: colorTop }} />
      )}
      <div
        style={{
          height,
          backgroundColor: colorTop,
          backgroundImage: `linear-gradient(${cssOrientation}, ${colorTop} calc(50% - 1px), ${colorBottom} 50.3%)`, // calc(50% - 1px) for blur the diagonal
        }}
      />
      {marginBottom > 0 && (
        <div style={{ height: marginBottom, backgroundColor: colorBottom }} />
      )}
    </div>
  );
};

export default LineDividerRenderer;
