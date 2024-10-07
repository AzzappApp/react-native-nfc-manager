/**
 * code from https://github.com/xxmuaddib/lottie-colorify/blob/master/src/index.ts
 * MIT License
 *
 * package is not maintained anymore so we internalized it
 */
import { Animation, LayerType, AssetType } from '@lottiefiles/lottie-js';
import cloneDeep from 'lodash/cloneDeep';
import type {
  ImageAsset,
  PrecompositionAsset,
  ImageLayer,
} from '@lottiefiles/lottie-js';

export const replaceColors = (
  replacements: Array<{
    sourceColor: number[] | string;
    targetColor: number[] | string;
  }>,
  lottieObj?: any,
  immutable = true,
) => {
  function doReplace(
    replacements: Array<{
      sourceColor: number[];
      targetColor: number[];
    }>,
    obj: any,
  ) {
    if (obj && obj.s && Array.isArray(obj.s) && obj.s.length === 4) {
      const identifiedColorIndex = replacements.findIndex(
        ({ sourceColor }) =>
          sourceColor[0] === obj.s[0] &&
          sourceColor[1] === obj.s[1] &&
          sourceColor[2] === obj.s[2],
      );
      if (identifiedColorIndex !== -1) {
        obj.s = [
          ...replacements[identifiedColorIndex].targetColor,
          obj.s[3] ?? 1,
        ];
      }
    } else if (obj?.c?.k || obj?.g?.k?.k || obj?.v?.k) {
      const array = obj?.c?.k ?? obj?.g?.k?.k ?? obj?.v?.k;
      if (Array.isArray(array))
        if (typeof array[0] !== 'number') {
          doReplace(replacements, array);
        } else {
          replacements.forEach(({ sourceColor, targetColor }) => {
            for (let i = 0; i < array.length; i += 1) {
              if (
                round(array[i]) === sourceColor[0] &&
                round(array[i + 1]) === sourceColor[1] &&
                round(array[i + 2]) === sourceColor[2]
              ) {
                array[i] = targetColor[0];
                array[i + 1] = targetColor[1];
                array[i + 2] = targetColor[2];
                i += 2;
              }
            }
          });
        }
    } else {
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          doReplace(replacements, obj[key]);
        }
      }
    }

    return obj;
  }
  return doReplace(
    replacements
      .map(({ sourceColor, targetColor }) => ({
        sourceColor: convertColorToLottieColor(sourceColor)!,
        targetColor: convertColorToLottieColor(targetColor)!,
      }))
      .filter(({ sourceColor, targetColor }) => sourceColor && targetColor),
    immutable ? cloneDeep(lottieObj) : lottieObj,
  );
};
const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
const hexRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

const convertColorToLottieColor = (_color: number[] | string | undefined) => {
  let color = _color;

  if (typeof _color === 'string' && _color.match(shorthandRegex)) {
    color = _color.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });
  }

  if (typeof color === 'string' && color.match(hexRegex)) {
    const result = hexRegex.exec(color);
    if (!result) {
      throw new Error('Color can be only hex or rgb array (ex. [10,20,30])');
    }
    return [
      Math.round((parseInt(result[1], 16) / 255) * 1000) / 1000,
      Math.round((parseInt(result[2], 16) / 255) * 1000) / 1000,
      Math.round((parseInt(result[3], 16) / 255) * 1000) / 1000,
    ];
  } else if (
    typeof color === 'object' &&
    color.length === 3 &&
    color.every(item => item >= 0 && item <= 255)
  ) {
    return [
      Math.round((color[0] / 255) * 1000) / 1000,
      Math.round((color[1] / 255) * 1000) / 1000,
      Math.round((color[2] / 255) * 1000) / 1000,
    ];
  } else if (!color) {
    return undefined;
  } else {
    throw new Error('Color can be only hex or rgb array (ex. [10,20,30])');
  }
};

const round = (n: number) => Math.round(n * 1000) / 1000;

export type LottieInfo = {
  duration: number;
  assetsInfos: LottieAssetInfo[];
};

export type LottieAssetInfo = {
  id: string;
  startTime: number;
  endTime: number;
  width: number;
  height: number;
};

export type LottieAssetFilter = {
  key: string;
  value: number | string;
};

export function extractLottieInfo(lottie: Record<string, any>): LottieInfo {
  const filteredLottie = applyLottieAssetFilters(lottie, [
    keepNonEncodedLottieAssets,
  ]);

  const animation = new Animation();
  animation.fromJSON(filteredLottie);

  const imageLayers = animation.layers.filter(
    layer => layer.type === LayerType.IMAGE,
  );

  imageLayers.push(
    ...animation.assets
      .filter(
        asset => 'type' in asset && asset.type === AssetType.PRECOMPOSITION,
      )
      .flatMap(asset => {
        const precompAssets = asset as PrecompositionAsset;
        return precompAssets.layers;
      }),
  );

  return {
    duration: animation.duration,
    assetsInfos: animation.assets
      .filter(asset => 'path' in asset)
      .map(asset => {
        const imageAsset = asset as ImageAsset;

        const mediaLayers = imageLayers.filter(
          layer => (layer as ImageLayer).refId === imageAsset.id,
        ) as ImageLayer[];

        const startFrame = mediaLayers.reduce(
          (min, layer) => Math.min(min, layer.inPoint),
          Infinity,
        );
        const endFrame = mediaLayers.reduce(
          (max, layer) => Math.max(max, layer.outPoint),
          0,
        );
        return {
          id: imageAsset.id!,
          startTime: startFrame / animation.frameRate,
          endTime: endFrame / animation.frameRate,
          width: imageAsset.width,
          height: imageAsset.height,
        };
      })
      .sort((a, b) => a.startTime - b.startTime),
  };
}

function applyLottieAssetFilters(
  lottie: Record<string, any>,
  filters: LottieAssetFilter[],
): Record<string, any> {
  let filteredLottie = cloneDeep(lottie);

  filters.forEach(filter => {
    filteredLottie = {
      ...filteredLottie,
      assets: filteredLottie.assets.filter(
        (asset: Record<string, any>) =>
          filter.key in asset && asset[filter.key] === filter.value,
      ),
    };
  });

  return filteredLottie;
}

const keepNonEncodedLottieAssets: LottieAssetFilter = {
  key: 'e',
  value: 0,
};
