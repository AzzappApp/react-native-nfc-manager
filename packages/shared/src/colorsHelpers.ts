import chroma from 'chroma-js';

export const colors = {
  white: '#FFFFFF',
  black: '#0E1216',
};

export const getTextColor = (backgroundColor: string) => {
  const rgba = chroma(backgroundColor).rgba();
  if (rgba[0] * 0.299 + rgba[1] * 0.587 + rgba[2] * 0.114 > 186) {
    return colors.black;
  } else {
    return colors.white;
  }
};

const RED = 0.2126;
const GREEN = 0.7152;
const BLUE = 0.0722;

const GAMMA = 2.4;

type FixedArray<TType, TLength extends number> = TType[] & { length: TLength };

const luminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, GAMMA);
  });
  return a[0] * RED + a[1] * GREEN + a[2] * BLUE;
};

const contrast = (rgb1: FixedArray<number, 3>, rgb2: FixedArray<number, 3>) => {
  const lum1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

export const getTextColorPrimaryForBackground = (
  primaryColor: string,
  backgroundColor: string,
) => {
  const rgba = chroma(primaryColor).rgb();
  const rgba2 = chroma(backgroundColor).rgb();
  const _contrast = contrast(rgba, rgba2);

  // We need to ensure the contast is heigh enough to apply the primary color
  // 8 is a random value. the recommandation is to have a contrast > 4.5
  if (_contrast >= 5) {
    return primaryColor;
  } else {
    return colors.white;
  }
};

export const convertHexToRGBA = (hexCode: string, opacityPercent = 100) => {
  'worklet';
  let hex = hexCode.replace('#', '');

  if (hex.length === 3) {
    hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return opacityPercent === 100
    ? `rgb(${r},${g},${b})`
    : `rgba(${r},${g},${b},${opacityPercent / 100})`;
};
