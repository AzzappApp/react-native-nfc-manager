import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { graphql, readInlineData } from 'react-relay';
import { type CardModuleColor } from '@azzapp/shared/cardModuleHelpers';
import { getTextStyle, getTitleStyle } from '#helpers/cardModuleHelpers';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Text from '#ui/Text';
import CardModuleEditionScrollHandler from '../CardModuleEditionScrollHandler';
import CardModulePressableTool from '../tool/CardModulePressableTool';
import withSwapCardModuleColor from '../withSwapCardModuleColor';
import type { Variant } from '#helpers/webcardModuleHelpers';
import type {
  TitleTextModuleRenderer_module$data,
  TitleTextModuleRenderer_module$key,
} from '#relayArtifacts/TitleTextModuleRenderer_module.graphql';
import type { CommonModuleRendererProps } from '../cardModuleEditorType';
import type { NullableFields } from '@azzapp/shared/objectHelpers';

/**
 * Render a SimpleButton module
 */
export const TitleTextModuleRendererFragment = graphql`
  fragment TitleTextModuleRenderer_module on CardModuleTitleText @inline {
    cardModuleColor {
      background
      content
      graphic
      text
      title
    }
    title
    text
  }
`;

export type TitleTextModuleRendererData = NullableFields<
  Omit<
    TitleTextModuleRenderer_module$data,
    ' $fragmentType' | 'cardModuleColor' | 'text' | 'title'
  >
> & {
  text: string;
  title: string;
  cardModuleColor: CardModuleColor;
};

export const readTitleTextModuleData = (
  module: TitleTextModuleRenderer_module$key,
) => readInlineData(TitleTextModuleRendererFragment, module);

export type TitleTextModuleRendererProps = CommonModuleRendererProps<
  TitleTextModuleRendererData,
  'titleText'
>;

const TitleTextModuleRenderer = ({
  data,
  variant,
  scrollPosition,
  cardStyle,
  dimension: providedDimension,
  setEditableItemIndex,
  onLayout,
}: TitleTextModuleRendererProps) => {
  const screenDimension = useScreenDimensions();
  const dimension = providedDimension ?? screenDimension;
  const onPressItem = useCallback(() => {
    setEditableItemIndex?.(0);
  }, [setEditableItemIndex]);

  const containerViewStyle = useMemo(() => {
    return {
      padding: Math.max(20, cardStyle?.gap ?? 0),
      width: dimension.width,
      gap: Math.max(20, cardStyle?.gap ?? 0),
      backgroundColor: data.cardModuleColor.background,
    };
  }, [cardStyle?.gap, data.cardModuleColor.background, dimension.width]);

  return (
    <CardModuleEditionScrollHandler scrollPosition={scrollPosition}>
      <CardModulePressableTool
        active={!!setEditableItemIndex}
        onPress={onPressItem}
        onLayout={onLayout}
      >
        {isVerticalVariant(variant) && (
          <View style={containerViewStyle}>
            <Text
              variant="large"
              style={[
                getTitleStyle(cardStyle, data.cardModuleColor),
                getTitleAlignmentStyle(variant),
              ]}
            >
              {data.title}
            </Text>
            <Text
              style={[
                getTextStyle(cardStyle, data.cardModuleColor),
                getTextAlignmentStyle(variant),
              ]}
            >
              {data.text}
            </Text>
          </View>
        )}
      </CardModulePressableTool>
    </CardModuleEditionScrollHandler>
  );
};

export default withSwapCardModuleColor<
  TitleTextModuleRendererData,
  'titleText'
>(TitleTextModuleRenderer);

const getTextAlignmentStyle = (variant: Variant<'titleText'>) => {
  switch (variant) {
    case 'left':
      return { textAlign: 'left' as const };
    case 'right':
      return { textAlign: 'right' as const };
    case 'center':
      return { textAlign: 'center' as const };
    case 'justified':
      return { textAlign: 'justify' as const };
    default:
      return { textAlign: 'left' as const };
  }
};

const getTitleAlignmentStyle = (variant: Variant<'titleText'>) => {
  //specific case for title
  if (variant === 'justified') {
    return { textAlign: 'left' as const };
  }
  return getTextAlignmentStyle(variant);
};

//help to determine if the variant has not column, same design for web/app
const isVerticalVariant = (variant: Variant<'titleText'>) =>
  variant === 'left' ||
  variant === 'right' ||
  variant === 'center' ||
  variant === 'justified';
