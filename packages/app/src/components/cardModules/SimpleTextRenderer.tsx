import { useIntl } from 'react-intl';
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
        kind
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
    kind,
  } = Object.assign({}, SIMPLE_TEXT_DEFAULT_VALUES, data);

  const intl = useIntl();

  return (
    <CardModuleBackground
      {...props}
      backgroundUri={background?.uri}
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
        {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          text ||
            (kind === 'simpleText'
              ? intl.formatMessage({
                  defaultMessage:
                    "Add your Text here. To edit this section, simply click on the text and start typing. You can change the font style, size, color, and alignment using the editing tools provided. Adjust the margins and the background for this section to match your webcard's design and branding.",
                  description: 'Default text for the simple text module',
                })
              : intl.formatMessage({
                  defaultMessage: 'Add section Title here',
                  description: 'Default text for the simple title module',
                }))
        }
      </Text>
    </CardModuleBackground>
  );
};
