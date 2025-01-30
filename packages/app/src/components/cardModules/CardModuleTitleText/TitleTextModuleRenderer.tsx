import { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { graphql, readInlineData } from 'react-relay';
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
import type {
  CardModuleDimension,
  CommonModuleRendererProps,
} from '../cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type {
  DisplayMode,
  CardModuleColor,
} from '@azzapp/shared/cardModuleHelpers';
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
  displayMode,
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
        {isVerticalVariant(variant, displayMode) ? (
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
        ) : (
          <View style={containerViewStyle}>
            <TitleTextColumnRenderer
              variant={variant}
              text={data.text}
              title={data.title}
              cardStyle={cardStyle}
              cardModuleColor={data.cardModuleColor}
              dimension={dimension}
            />
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
    case 'column_1':
    case 'column_2':
    case 'column_3':
    case 'column_4':
      return { textAlign: 'left' as const };
    case 'right':
      return { textAlign: 'right' as const };
    case 'center':
      return { textAlign: 'center' as const };
    case 'justified':
    case 'column_1_justified':
    case 'column_2_justified':
    case 'column_3_justified':
    case 'column_4_justified':
      return { textAlign: 'justify' as const };
    default:
      return { textAlign: 'left' as const };
  }
};

const getTitleAlignmentStyle = (variant: Variant<'titleText'>) => {
  //specific case for title
  if (
    variant === 'justified' ||
    variant === 'column_1_justified' ||
    variant === 'column_2_justified' ||
    variant === 'column_3_justified' ||
    variant === 'column_4_justified'
  ) {
    return { textAlign: 'left' as const };
  }
  return getTextAlignmentStyle(variant);
};

//help to determine if the variant has not column, same design for web/app
const isVerticalVariant = (
  variant: Variant<'titleText'>,
  displayMode: DisplayMode,
) => {
  if (displayMode === 'mobile') {
    return true;
  }
  return (
    variant === 'left' ||
    variant === 'right' ||
    variant === 'center' ||
    variant === 'justified'
  );
};

const TitleTextColumnRenderer = ({
  variant,
  text,
  title,
  cardStyle,
  cardModuleColor,
}: {
  variant: Variant<'titleText'>;
  text: string;
  title: string;
  cardStyle: CardStyle | null | undefined;
  cardModuleColor: CardModuleColor;
  dimension: CardModuleDimension;
}) => {
  const nbColumn = variantToNbColumn(variant);
  const columns = useMemo(
    () => splitTextIntoColumns(text, nbColumn),
    [text, nbColumn],
  );
  const textViewContainerStyle = useMemo(() => {
    return {
      flex: 1,
    };
  }, []);

  const renderTextColumn = useMemo(() => {
    return columns.map((column, index) => {
      return (
        <View
          style={textViewContainerStyle}
          key={`titleTextModule_column_${index}`}
        >
          <Text
            style={[
              getTextStyle(cardStyle, cardModuleColor),
              getTextAlignmentStyle(variant),
            ]}
          >
            {column}
          </Text>
        </View>
      );
    });
  }, [cardModuleColor, cardStyle, columns, textViewContainerStyle, variant]);

  return (
    <View
      style={{
        flexDirection: iSplitLayout(variant) ? 'column' : 'row',
        gap: Math.max(20, cardStyle?.gap ?? 0),
      }}
    >
      <View style={textViewContainerStyle}>
        <Text
          variant="large"
          style={[
            getTitleStyle(cardStyle, cardModuleColor),
            getTitleAlignmentStyle(variant),
          ]}
        >
          {title}
        </Text>
      </View>
      {!iSplitLayout(variant) ? (
        renderTextColumn
      ) : (
        <View
          style={[styles.splitView, { gap: Math.max(20, cardStyle?.gap ?? 0) }]}
        >
          {renderTextColumn}
        </View>
      )}
    </View>
  );
};

const splitTextIntoColumns = (text: string, nbColumn: number): string[] => {
  const words = text.split(' ');
  const columns = Array.from({ length: nbColumn }, () => '');

  words.forEach((word, index) => {
    columns[index % nbColumn] += `${word} `;
  });

  return columns;
};

//when 1/2 column, the layout if fully horizonta with the title on left
//when 3/4 column, the title is on top, and columns are under (called split). and there is one left column
const iSplitLayout = (variant: Variant<'titleText'>) => {
  switch (variant) {
    case 'column_1':
    case 'column_2':
    case 'column_1_justified':
    case 'column_2_justified':
      return false;
    case 'column_3':
    case 'column_4':
    case 'column_3_justified':
    case 'column_4_justified':
      return true;
    default:
      return false;
  }
};

const variantToNbColumn = (variant: Variant<'titleText'>): number => {
  switch (variant) {
    case 'column_1':
    case 'column_1_justified':
      return 1;
    case 'column_2':
    case 'column_2_justified':
    case 'column_3':
    case 'column_3_justified':
      return 2;
    case 'column_4':
    case 'column_4_justified':
      return 3;
    default:
      return 1;
  }
};

const styles = StyleSheet.create({
  splitView: { flexDirection: 'row', flex: 1 },
});
