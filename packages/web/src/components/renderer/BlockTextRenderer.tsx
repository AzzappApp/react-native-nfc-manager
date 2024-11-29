import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  BLOCK_TEXT_DEFAULT_VALUES,
  BLOCK_TEXT_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import { fontsMap } from '#helpers/fonts';
import CardModuleBackground from '../CardModuleBackground';
import type { ModuleRendererProps } from './ModuleRenderer';
import type { CardModuleBlockText } from '@azzapp/data';

export type BlockTextRendererProps = ModuleRendererProps<CardModuleBlockText> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

/**
 * Render a BlockText module
 */
const BlockTextRenderer = ({
  module,
  colorPalette,
  cardStyle,
  coverBackgroundColor,
  ...props
}: BlockTextRendererProps) => {
  const {
    text,
    fontFamily,
    fontColor,
    textAlign,
    fontSize,
    verticalSpacing,
    textMarginVertical,
    textMarginHorizontal,
    marginHorizontal,
    marginVertical,
    textBackgroundId,
    textBackgroundStyle,
    backgroundId,
    backgroundStyle,
  } = getModuleDataValues({
    data: module.data,
    cardStyle,
    styleValuesMap: BLOCK_TEXT_STYLE_VALUES,
    defaultValues: BLOCK_TEXT_DEFAULT_VALUES,
  });

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
      colorPalette={colorPalette}
      style={{
        paddingLeft: marginHorizontal,
        paddingRight: marginHorizontal,
        paddingTop: marginVertical,
        paddingBottom: marginVertical,
      }}
    >
      <div style={{ maxWidth: '800px', margin: 'auto' }}>
        <CardModuleBackground
          {...props}
          backgroundId={textBackgroundId}
          backgroundStyle={textBackgroundStyle}
          colorPalette={colorPalette}
          style={{
            paddingLeft: textMarginHorizontal,
            paddingRight: textMarginHorizontal,
            paddingTop: textMarginVertical,
            paddingBottom: textMarginVertical,
          }}
        >
          <p
            style={{
              marginTop: 10,
              marginBottom: 10,
              textAlign,
              color: swapColor(fontColor, colorPalette),
              fontSize,
              lineHeight:
                fontSize && verticalSpacing
                  ? `${fontSize * 1.2 + verticalSpacing}px`
                  : undefined,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
            className={fontsMap[fontFamily].className}
          >
            {text}
          </p>
        </CardModuleBackground>
      </div>
    </CardModuleBackground>
  );
};

export default BlockTextRenderer;
