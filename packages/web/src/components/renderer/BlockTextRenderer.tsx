import { BLOCK_TEXT_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from '../CardModuleBackground';
import type { ModuleRendererProps } from './ModuleRenderer';

export type BlockTextRendererProps = ModuleRendererProps &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

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
      <div style={{ maxWidth: '800px', margin: 'auto' }}>
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
              marginTop: 10,
              marginBottom: 10,
              textAlign,
              color: fontColor,
              fontSize,
              fontFamily,
              lineHeight:
                fontSize && verticalSpacing
                  ? `${fontSize * 1.2 + verticalSpacing}px`
                  : undefined,
              whiteSpace: 'pre-line',
            }}
          >
            {text}
          </p>
        </CardModuleBackground>
      </div>
    </CardModuleBackground>
  );
};

export default BlockTextRenderer;
