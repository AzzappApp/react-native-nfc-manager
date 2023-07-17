import {
  SIMPLE_TEXT_DEFAULT_VALUES,
  SIMPLE_TITLE_DEFAULT_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from '../CardModuleBackground';
import type { ModuleRendererProps } from './ModuleRenderer';

type SimpleTextRendererProps = ModuleRendererProps &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const SimpleTextRenderer = ({
  module,
  style,
  ...props
}: SimpleTextRendererProps) => {
  const {
    text,
    fontFamily,
    fontSize,
    textAlign,
    color,
    verticalSpacing,
    marginHorizontal,
    marginVertical,
    backgroundId,
    backgroundStyle,
  } = Object.assign(
    {},
    module.kind === 'simpleText'
      ? SIMPLE_TEXT_DEFAULT_VALUES
      : SIMPLE_TITLE_DEFAULT_VALUES,
    module.data,
  );

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
      style={{
        ...style,
        paddingLeft: marginHorizontal,
        paddingRight: marginHorizontal,
        paddingTop: marginVertical,
        paddingBottom: marginVertical,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          textAlign,
          color,
          fontSize,
          fontFamily,
          lineHeight:
            fontSize && verticalSpacing
              ? `${fontSize * 1.2 + verticalSpacing}px`
              : undefined,
          position: 'relative',
        }}
      >
        {text}
      </div>
    </CardModuleBackground>
  );
};

export default SimpleTextRenderer;
