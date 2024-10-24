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
