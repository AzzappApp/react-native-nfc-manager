import * as Sentry from '@sentry/react-native';
import {
  Canvas,
  ImageSVG,
  rect,
  fitbox,
  Group,
  Paint,
  BlendColor,
  Skia,
} from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import type { SkSVG } from '@shopify/react-native-skia';
import type { ColorValue } from 'react-native';

type CardModuleBackgroundImageProps = {
  layout: { width: number; height: number };
  resizeMode: string | null | undefined;
  backgroundUri: string | null | undefined;
  patternColor: ColorValue | string | null | undefined;
  backgroundOpacity: number;
};

const CardModuleBackgroundImage = (props: CardModuleBackgroundImageProps) => {
  const { layout, resizeMode, backgroundUri, patternColor, backgroundOpacity } =
    props;

  const [svg, setSVG] = useState<SkSVG | null>(null);

  useEffect(() => {
    let canceled = false;
    const fetchSvg = async () => {
      if (!backgroundUri) {
        setSVG(null);
        return;
      }
      try {
        const resp = await fetch(backgroundUri);
        if (canceled) {
          return;
        }
        if (!resp.ok) {
          throw new Error(`Failed to fetch ${backgroundUri}`);
        }
        const svgSrc = await resp.text();
        if (canceled) {
          return;
        }
        setSVG(Skia.SVG.MakeFromString(svgSrc));
      } catch (e) {
        if (canceled) {
          return;
        }
        console.warn(`Failed to load SVG: ${backgroundUri}`, e);
        Sentry.captureException(e);
        setSVG(null);
      }
    };
    fetchSvg();

    return () => {
      canceled = true;
    };
  }, [backgroundUri]);

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
      <Canvas style={styles.container} opaque>
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
      <Canvas style={[styles.container, { height: Math.ceil(dst.height) }]}>
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
    pointerEvents: 'none',
  },
});

export default CardModuleBackgroundImage;
