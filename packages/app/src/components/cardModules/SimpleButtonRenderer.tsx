import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Linking, Text, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { SIMPLE_BUTTON_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import PressableOpacity from '#ui/PressableOpacity';
import CardModuleBackground from './CardModuleBackground';
import type { SimpleButtonEditionValue } from '#screens/SimpleButtonEditionScreen/simpleButtonEditionScreenTypes';
import type {
  SimpleButtonRenderer_module$data,
  SimpleButtonRenderer_module$key,
} from '@azzapp/relay/artifacts/SimpleButtonRenderer_module.graphql';
import type { ViewProps } from 'react-native';

export type SimpleButtonRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a SimpleButton module
   */
  module: SimpleButtonRenderer_module$key;
};

/**
 * Render a SimpleButton module
 */
const SimpleButtonRenderer = ({
  module,
  ...props
}: SimpleButtonRendererProps) => {
  const data = useFragment(
    graphql`
      fragment SimpleButtonRenderer_module on CardModule {
        id
        ... on CardModuleSimpleButton {
          buttonLabel
          actionType
          actionLink
          fontFamily
          fontColor
          fontSize
          buttonColor
          borderColor
          borderWidth
          borderRadius
          marginTop
          marginBottom
          width
          height
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
  return <SimpleButtonRendererRaw data={data} {...props} />;
};

export default SimpleButtonRenderer;

export type SimpleButtonRawData = Omit<
  SimpleButtonRenderer_module$data,
  ' $fragmentType'
>;

type SimpleButtonRendererRawProps = ViewProps & {
  /**
   * The data for the SimpleButton module
   */
  data: SimpleButtonRawData;
};

/**
 * Raw implementation of the SimpleButton module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const SimpleButtonRendererRaw = ({
  data,
  style,
  ...props
}: SimpleButtonRendererRawProps) => {
  const {
    buttonLabel,
    actionType,
    actionLink,
    fontFamily,
    fontColor,
    fontSize,
    buttonColor,
    borderColor,
    borderWidth,
    borderRadius,
    marginTop,
    marginBottom,
    width,
    height,
    background,
    backgroundStyle,
  } = Object.assign(
    {},
    SIMPLE_BUTTON_DEFAULT_VALUES,
    data,
  ) as SimpleButtonEditionValue;

  const intl = useIntl();

  const onPress = useCallback(async () => {
    if (actionLink) {
      if (actionType === 'link') {
        await Linking.openURL(actionLink);
      } else if (actionType === 'email') {
        await Linking.openURL(`mailto:${actionLink}`);
      } else {
        await Linking.openURL(`tel:${actionLink}`);
      }
    }
  }, [actionLink, actionType]);

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
          height: height + marginTop + marginBottom,
          alignItems: 'center',
        },
      ]}
    >
      <PressableOpacity onPress={onPress}>
        <View
          style={{
            height,
            width,
            marginBottom,
            marginTop,
            backgroundColor: buttonColor,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius,
            borderWidth,
            borderColor,
            overflow: 'hidden',
          }}
        >
          <Text
            style={{
              fontFamily,
              color: fontColor,
              fontSize,
              flexWrap: 'nowrap',
            }}
            numberOfLines={1}
          >
            {
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              buttonLabel ||
                intl.formatMessage({
                  defaultMessage: 'Button Label',
                  description: 'Placeholder for button that has no label yet',
                })
            }
          </Text>
        </View>
      </PressableOpacity>
    </CardModuleBackground>
  );
};
