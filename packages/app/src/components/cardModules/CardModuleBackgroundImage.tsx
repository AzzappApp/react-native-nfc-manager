import {
  Canvas,
  ImageSVG,
  rect,
  fitbox,
  Group,
  useSVG,
  Paint,
  BlendColor,
  useImage,
  Image,
} from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';
import type { ColorValue } from 'react-native';

type CardModuleBackgroundImageProps = {
  layout: { width: number; height: number };
  resizeMode: string | null | undefined;
  backgroundUri: string | null | undefined;
  patternColor: ColorValue | string | null | undefined;
  backgroundOpacity: number;
};

const CardModuleBackgroundImage = (props: CardModuleBackgroundImageProps) => {
  if (!props.backgroundUri) {
    return null;
  }
  if (props.backgroundUri.endsWith('.svg')) {
    return <CardModuleBackgroundSvgImage {...props} />;
  } else {
    return <CardModuleBackgroundImageInner {...props} />;
  }
};

const CardModuleBackgroundImageInner = (
  props: CardModuleBackgroundImageProps,
) => {
  const { layout, backgroundUri, resizeMode, patternColor, backgroundOpacity } =
    props;
  const image = useImage(backgroundUri);

  if (image) {
    return (
      <Canvas style={styles.container}>
        <Group
          opacity={backgroundOpacity}
          layer={
            <Paint>
              <BlendColor
                color={patternColor?.toString() ?? 'black'}
                mode="srcIn"
              />
            </Paint>
          }
        >
          <Image
            image={image}
            fit={resizeMode === 'contain' ? 'contain' : 'fill'}
            x={0}
            y={0}
            width={layout.width}
            height={layout.height}
          />
        </Group>
      </Canvas>
    );
  }

  return null;
};

const CardModuleBackgroundSvgImage = (
  props: CardModuleBackgroundImageProps,
) => {
  const { layout, resizeMode, backgroundUri, patternColor, backgroundOpacity } =
    props;

  const svg = useSVG(backgroundUri);

  if (!svg) {
    return null;
  }
  const svgWidth = svg.width();
  const svgHeight = svg.height();
  if (resizeMode === 'repeat') {
    const numberOfColumns = Math.ceil(layout.width / svgWidth);
    const numberOfRows = Math.ceil(layout.height / svgHeight);

    const sprites = new Array(numberOfRows * numberOfColumns)
      .fill(0)
      .map((_, i) => {
        const x = i % numberOfColumns;
        const y = Math.floor(i / numberOfColumns);
        return { x: x * svgWidth, y: y * svgHeight };
      });

    return (
      <Canvas style={styles.container}>
        <Group
          opacity={backgroundOpacity}
          layer={
            <Paint>
              <BlendColor
                color={patternColor?.toString() ?? 'black'}
                mode="srcATop"
              />
            </Paint>
          }
        >
          {sprites.map(s => (
            <ImageSVG
              key={`${s.x}-${s.y}`}
              svg={svg}
              x={s.x}
              y={s.y}
              width={svg.width()}
              height={svg.height()}
            />
          ))}
        </Group>
      </Canvas>
    );
  }

  const src = rect(0, 0, svgWidth, svgHeight);
  const dst = rect(0, 0, layout.width, layout.height);

  return (
    svg && (
      <Canvas style={styles.container}>
        <Group
          opacity={backgroundOpacity}
          transform={fitbox(
            resizeMode === 'cover'
              ? 'cover'
              : resizeMode === 'contain'
                ? 'contain'
                : resizeMode === 'stretch'
                  ? 'fill'
                  : 'scaleDown',
            src,
            dst,
          )}
          layer={
            <Paint>
              <BlendColor
                color={patternColor?.toString() ?? 'black'}
                mode="srcATop"
              />
            </Paint>
          }
        >
          <ImageSVG svg={svg} width={svgWidth} height={svgHeight} />
        </Group>
      </Canvas>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
    pointerEvents: 'none',
  },
});

export default CardModuleBackgroundImage;
