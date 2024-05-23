import { typedEntries } from '@azzapp/shared/objectHelpers';
import type {
  CropData,
  EditionParameters,
  ImageOrientation,
} from './EditionParameters';

const LAYOUT_PARAMETERS = ['cropData', 'orientation', 'roll'];

export const extractLayoutParameters = (
  parameters: EditionParameters | null | undefined,
): [
  layoutParameters: EditionParameters,
  otherParameters: EditionParameters,
] => {
  const layoutParameters: EditionParameters = {};
  const otherParameters: EditionParameters = {};
  if (!parameters) {
    return [layoutParameters, otherParameters];
  }
  typedEntries(parameters).forEach(([key, value]) => {
    if (LAYOUT_PARAMETERS.includes(key)) {
      layoutParameters[key] = value as any;
    } else {
      otherParameters[key] = value as any;
    }
  });
  return [layoutParameters, otherParameters];
};

export const cropDataForAspectRatio = (
  mediaWidth: number,
  mediaHeight: number,
  aspectRatio: number,
): CropData => {
  if (mediaWidth / mediaHeight > aspectRatio) {
    return {
      originX: (mediaWidth - mediaHeight * aspectRatio) / 2,
      originY: 0,
      height: mediaHeight,
      width: mediaHeight * aspectRatio,
    };
  } else {
    return {
      originX: 0,
      originY: (mediaHeight - mediaWidth / aspectRatio) / 2,
      height: mediaWidth / aspectRatio,
      width: mediaWidth,
    };
  }
};

export const getNextOrientation = (
  orientation?: string | null,
): ImageOrientation => {
  switch (orientation) {
    case 'LEFT':
      return 'DOWN';
    case 'DOWN':
      return 'RIGHT';
    case 'RIGHT':
      return 'UP';
    case 'UP':
    default:
      return 'LEFT';
  }
};
