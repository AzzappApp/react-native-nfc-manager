import { Text } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { SIMPLE_TEXT_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from './CardModuleBackground';
import type {
  SimpleTextRenderer_module$data,
  SimpleTextRenderer_module$key,
} from '@azzapp/relay/artifacts/SimpleTextRenderer_module.graphql';
import type { ViewProps, ColorValue } from 'react-native';

export type SimpleTextRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a simple text module
   */
  module: SimpleTextRenderer_module$key;
};

/**
 * Render a simple text module
 */
const SimpleTextRenderer = ({ module, ...props }: SimpleTextRendererProps) => {
  const data = useFragment(
    graphql`
      fragment SimpleTextRenderer_module on CardModule {
        ... on CardModuleSimpleText {
          text
          fontFamily
          fontSize
          color
          textAlign
          verticalSpacing
          marginHorizontal
          marginVertical
          background {
            uri
          }
          backgroundStyle {
            backgroundColor
            patternColor
            opacity
          }
        }
        ... on CardModuleSimpleTitle {
          text
          fontFamily
          fontSize
          color
          textAlign
          verticalSpacing
          marginHorizontal
          marginVertical
          background {
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
  return <SimpleTextRendererRaw data={data} {...props} />;
};

export default SimpleTextRenderer;

export type SimpleTextRawData = Omit<
  SimpleTextRenderer_module$data,
  ' $fragmentType'
>;

type SimpleTextRendererRawProps = ViewProps & {
  /**
   * The data for the simple text module
   */
  data: SimpleTextRawData;
};

/**
 * Raw implementation of the simple text module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const SimpleTextRendererRaw = ({
  data,
  style,
  ...props
}: SimpleTextRendererRawProps) => {
  const {
    text,
    fontFamily,
    fontSize,
    textAlign,
    color,
    verticalSpacing,
    marginHorizontal,
    marginVertical,
    background,
    backgroundStyle,
  } = Object.assign({}, SIMPLE_TEXT_DEFAULT_VALUES, data);

  return (
    <CardModuleBackground
      {...props}
      backgroundUri={background?.uri}
      backgroundOpacity={backgroundStyle?.opacity}
      backgroundColor={backgroundStyle?.backgroundColor}
      patternColor={backgroundStyle?.patternColor}
      style={[
        style,
        {
          paddingHorizontal: marginHorizontal,
          paddingVertical: marginVertical,
          flexShrink: 0,
        },
      ]}
    >
      <Text
        style={{
          textAlign,
          color: color as ColorValue,
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
  );
};
