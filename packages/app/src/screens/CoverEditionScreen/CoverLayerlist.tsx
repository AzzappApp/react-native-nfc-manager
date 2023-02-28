import { useCallback, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import PressableNative from '#ui/PressableNative';
import ViewTransition from '#ui/ViewTransition';
import type {
  CoverLayerlist_layers$data,
  CoverLayerlist_layers$key,
} from '@azzapp/relay/artifacts/CoverLayerlist_layers.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type {
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  ColorValue,
  ListRenderItemInfo,
} from 'react-native';

type CoverLayerListProps = {
  layers: CoverLayerlist_layers$key;
  selectedLayer: string | null | undefined;
  onSelectLayer: (media: string | null) => void;
  backgroundColor?: ColorValue;
  tintColor?: ColorValue;
  style: StyleProp<ViewStyle>;
};

const CoverLayerList = ({
  layers: layersKey,
  selectedLayer: selectedMedia,
  onSelectLayer,
  backgroundColor = '#00000000',
  tintColor = '#000000',
  style,
}: CoverLayerListProps) => {
  const medias = useFragment(
    graphql`
      fragment CoverLayerlist_layers on CoverLayer @relay(plural: true) {
        id
        uri
        # we use arbitrary values here, but it should be good enough
        smallURI: uri(width: 125, pixelRatio: 2)
      }
    `,
    layersKey,
  );
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const borderRadius = Platform.select({
    web: `${COVER_CARD_RADIUS}%` as any,
    default: COVER_CARD_RADIUS * width,
  });

  const renderItem = useCallback(
    ({
      item,
    }: ListRenderItemInfo<ArrayItemType<CoverLayerlist_layers$data> | null>) => {
      // eslint-disable-next-line eqeqeq
      const selected = selectedMedia == item?.id;
      return (
        <ViewTransition
          transitionDuration={120}
          transitions={['transform']}
          style={[
            styles.buttonContainer,
            { transform: [{ scale: selected ? 1.1 : 1 }] },
          ]}
        >
          <PressableNative
            style={[styles.button, { borderRadius }]}
            onPress={() => onSelectLayer(item?.id ?? null)}
          >
            {item?.smallURI ? (
              <Image
                source={{ uri: item?.smallURI }}
                style={[
                  styles.image,
                  {
                    borderRadius: !selected && borderRadius,
                    backgroundColor,
                    tintColor,
                  },
                ]}
                onLayout={onLayout}
              />
            ) : (
              <View
                style={[
                  styles.image,
                  styles.nullImage,
                  { borderRadius, backgroundColor },
                ]}
              />
            )}
          </PressableNative>
        </ViewTransition>
      );
    },
    [backgroundColor, borderRadius, onSelectLayer, selectedMedia, tintColor],
  );

  return (
    <FlatList
      data={[null, ...medias]}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={styles.container}
      renderItem={renderItem}
    />
  );
};

export default CoverLayerList;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingStart: 20,
  },
  buttonContainer: {
    height: '100%',
    marginEnd: 10,
  },
  button: {
    flex: 1,
    overflow: 'hidden',
  },
  image: {
    aspectRatio: COVER_RATIO,
    height: '100%',
  },
  nullImage: {
    borderWidth: 2,
    borderColor: colors.black,
  },
});
