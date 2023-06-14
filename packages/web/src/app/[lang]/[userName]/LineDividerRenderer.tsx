import { LINE_DIVIDER_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import type { CardModule } from '@azzapp/data/domains';

export type LineDividerRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children'
> & {
  module: CardModule;
};

/**
 * Render a line divider module
 */
const LineDividerRenderer = ({
  module,
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
  } = Object.assign({}, LINE_DIVIDER_DEFAULT_VALUES, module.data);

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
          backgroundImage: `linear-gradient(${cssOrientation}, ${colorTop} 50%, ${colorBottom} 50%)`,
          marginBottom: -1,
          marginTop: -1,
        }}
      />
      {marginBottom > 0 && (
        <div style={{ height: marginBottom, backgroundColor: colorBottom }} />
      )}
    </div>
  );
};

export default LineDividerRenderer;
