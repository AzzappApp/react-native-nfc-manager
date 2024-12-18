import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  SIMPLE_TEXT_DEFAULT_VALUES,
  SIMPLE_TEXT_STYLE_VALUES,
  SIMPLE_TITLE_DEFAULT_VALUES,
  SIMPLE_TITLE_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import { fontsMap } from '#helpers/fonts';
import CardModuleBackground from '../CardModuleBackground';
import type { ModuleRendererProps } from './ModuleRenderer';
import type { CardModuleSimpleText } from '@azzapp/data';

type SimpleTextRendererProps = ModuleRendererProps<CardModuleSimpleText> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const SimpleTextRenderer = ({
  module,
  cardStyle,
  colorPalette,
  style,
  coverBackgroundColor,
  ...props
}: SimpleTextRendererProps) => {
  const {
    text,
    fontFamily,
    fontSize,
    textAlign,
    fontColor,
    verticalSpacing,
    marginHorizontal,
    marginVertical,
    backgroundId,
    backgroundStyle,
  } = getModuleDataValues({
    data: module.data,
    cardStyle,
    styleValuesMap:
      module.kind === 'simpleText'
        ? SIMPLE_TEXT_STYLE_VALUES
        : SIMPLE_TITLE_STYLE_VALUES,
    defaultValues:
      module.kind === 'simpleText'
        ? SIMPLE_TEXT_DEFAULT_VALUES
        : SIMPLE_TITLE_DEFAULT_VALUES,
  });

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
      colorPalette={colorPalette}
      style={style}
    >
      <div style={{ maxWidth: '800px', margin: 'auto' }}>
        <div
          style={{
            textAlign,
            color: swapColor(fontColor, colorPalette),
            fontSize,
            lineHeight:
              fontSize && verticalSpacing
                ? `${fontSize * 1.2 + verticalSpacing}px`
                : undefined,
            position: 'relative',
            paddingLeft: marginHorizontal,
            paddingRight: marginHorizontal,
            paddingTop: marginVertical,
            paddingBottom: marginVertical,
            flexShrink: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
          className={fontsMap[fontFamily].className}
        >
          {text}
        </div>
      </div>
    </CardModuleBackground>
  );
};

export default SimpleTextRenderer;
