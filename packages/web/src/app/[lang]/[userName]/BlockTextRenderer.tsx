import { BLOCK_TEXT_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from './CardModuleBackground';
import type { CardModule } from '@azzapp/data/domains';

export type BlockTextRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children'
> & {
  module: CardModule;
};

/**
 * Render a BlockText module
 */
const BlockTextRenderer = ({ module, ...props }: BlockTextRendererProps) => {
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
  } = Object.assign({}, BLOCK_TEXT_DEFAULT_VALUES, module.data);

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
      style={{
        paddingLeft: marginHorizontal,
        paddingRight: marginHorizontal,
        paddingTop: marginVertical,
        paddingBottom: marginVertical,
      }}
    >
      <CardModuleBackground
        backgroundId={textBackgroundId}
        backgroundStyle={textBackgroundStyle}
        style={{
          paddingLeft: textMarginHorizontal,
          paddingRight: textMarginHorizontal,
          paddingTop: textMarginVertical,
          paddingBottom: textMarginVertical,
        }}
      >
        <p
          style={{
            textAlign,
            color: fontColor,
            fontSize,
            fontFamily,
            lineHeight:
              fontSize && verticalSpacing
                ? `${fontSize * 1.2 + verticalSpacing}px`
                : undefined,
          }}
        >
          {text}
        </p>
      </CardModuleBackground>
    </CardModuleBackground>
  );
};

export default BlockTextRenderer;
