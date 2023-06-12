import { graphql, useFragment } from 'react-relay';
import { BLOCK_TEXT_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import Text from '#ui/Text';
import CardModuleBackground from './CardModuleBackground';
import type {
  BlockTextRenderer_module$data,
  BlockTextRenderer_module$key,
} from '@azzapp/relay/artifacts/BlockTextRenderer_module.graphql';
import type { ViewProps, ColorValue } from 'react-native';

export type BlockTextRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a BlockText module
   */
  module: BlockTextRenderer_module$key;
};

/**
 * Render a BlockText module
 */
const BlockTextRenderer = ({ module, ...props }: BlockTextRendererProps) => {
  const data = useFragment(
    graphql`
      fragment BlockTextRenderer_module on CardModule {
        id
        ... on CardModuleBlockText {
          text
          fontFamily
          fontColor
          textAlign
          fontSize
          verticalSpacing
          textMarginVertical
          textMarginHorizontal
          marginHorizontal
          marginVertical
          textBackground {
            id
            uri
          }
          textBackgroundStyle {
            backgroundColor
            patternColor
            opacity
          }
          background {
            id
            uri
          }
          backgroundStyle {
            backgroundColor
            patternColor
            opacity
          }
        }
      }
    `,
    module,
  );
  return <BlockTextRendererRaw data={data} {...props} />;
};

export default BlockTextRenderer;

export type BlockTextRawData = Omit<
  BlockTextRenderer_module$data,
  ' $fragmentType'
>;

type BlockTextRendererRawProps = ViewProps & {
  /**
   * The data for the BlockText module
   */
  data: BlockTextRawData;
};

/**
 * Raw implementation of the BlockText module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const BlockTextRendererRaw = ({
  data,
  ...props
}: BlockTextRendererRawProps) => {
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
    textBackground,
    textBackgroundStyle,
    background,
    backgroundStyle,
  } = Object.assign({}, BLOCK_TEXT_DEFAULT_VALUES, data);

  return (
    <CardModuleBackground
      {...props}
      backgroundUri={background?.uri}
      backgroundOpacity={backgroundStyle?.opacity}
      backgroundColor={backgroundStyle?.backgroundColor}
      patternColor={backgroundStyle?.patternColor}
    >
      <CardModuleBackground
        {...props}
        backgroundUri={textBackground?.uri}
        backgroundOpacity={textBackgroundStyle?.opacity}
        backgroundColor={textBackgroundStyle?.backgroundColor}
        patternColor={textBackgroundStyle?.patternColor}
        style={{
          marginVertical: 2 * marginVertical,
          marginHorizontal: 2 * marginHorizontal,
        }}
      >
        <Text
          style={{
            paddingHorizontal: 2 * textMarginHorizontal,
            paddingVertical: 2 * textMarginVertical,
            textAlign,
            color: fontColor as ColorValue,
            fontSize,
            fontFamily,
            lineHeight:
              fontSize && verticalSpacing
                ? fontSize * 1.2 + verticalSpacing
                : undefined,
          }}
        >
          {text}
        </Text>
      </CardModuleBackground>
    </CardModuleBackground>
  );
};
