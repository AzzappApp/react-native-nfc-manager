import chroma from 'chroma-js';
import { colors } from '#theme';

export const getTextColor = (backgroundColor: string) => {
  const rgba = chroma(backgroundColor).rgba();
  if (rgba[0] * 0.299 + rgba[1] * 0.587 + rgba[2] * 0.114 > 186) {
    return colors.black;
  } else {
    return colors.white;
  }
};
