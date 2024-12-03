import { View } from 'react-native';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import CardModuleMediaItem from './CardModuleMediaItem';
import type { CardModuleSourceMedia } from './cardModuleEditorType';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { ViewProps } from 'react-native';

type AlternationContainerProps = ViewProps & {
  viewMode: 'desktop' | 'mobile';
  dimension: {
    width: number;
    height: number;
  };
  borderRadius?: number;
  media: CardModuleSourceMedia;
  cardStyle: CardStyle | null | undefined;
  index: number;
};
/**
 * ALternation container for the section module type
 * it always containt a media and ONE children
 * @return {*}
 */
const AlternationContainer = ({
  viewMode,
  dimension,
  cardStyle,
  style,
  children,
  media,
  index,
  ...props
}: AlternationContainerProps) => {
  const styles = useVariantStyleSheet(stylesheet, viewMode);
  const mediaWidth =
    viewMode === 'desktop'
      ? (dimension.width - 2 * PADDING_HORIZONTAL - HORIZONTAL_GAP) / 2
      : dimension.width - 2 * PADDING_HORIZONTAL;

  if (!media || !children) {
    return null;
  }

  return (
    <View
      {...props}
      style={[styles.container, { width: dimension.width }, style]}
    >
      {viewMode === 'mobile' || index % 2 === 0 ? (
        <View
          style={[
            styles.imageContainer,
            { width: mediaWidth, borderRadius: cardStyle?.borderRadius ?? 0 },
          ]}
        >
          <CardModuleMediaItem
            media={media}
            dimension={{
              width: mediaWidth,
              height: mediaWidth,
            }}
          />
        </View>
      ) : null}
      <View style={{ width: mediaWidth }}>{children}</View>
      {viewMode === 'desktop' && index % 2 === 1 ? (
        <View
          style={[
            styles.imageContainer,
            { width: mediaWidth, borderRadius: cardStyle?.borderRadius ?? 0 },
          ]}
        >
          <CardModuleMediaItem
            media={media}
            dimension={{
              width: mediaWidth,
              height: mediaWidth,
            }}
          />
        </View>
      ) : null}
    </View>
  );
};
const HORIZONTAL_GAP = 40;
const PADDING_HORIZONTAL = 20;

const stylesheet = createVariantsStyleSheet(() => ({
  default: {
    container: { borderRadius: 0 },
    imageContainer: { overflow: 'hidden' },
  },
  mobile: {
    container: {
      flex: 1,
      flexDirection: 'column',
      paddingHorizontal: PADDING_HORIZONTAL,
      paddingVertical: 20,
      rowGap: 20,
    },
  },
  desktop: {
    container: {
      flex: 1,
      flexDirection: 'row',
      paddingHorizontal: PADDING_HORIZONTAL,
      paddingVertical: 20,
      columnGap: 40,
    },
  },
}));

export default AlternationContainer;
