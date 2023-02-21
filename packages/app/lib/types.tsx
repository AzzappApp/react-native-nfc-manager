type MediaBase = {
  galleryUri?: string;
  uri: string;
  width: number;
  height: number;
};

export type MediaImage = MediaBase & { kind: 'image' };

export type MediaVideo = MediaBase & {
  kind: 'video';
  duration: number;
};

export type Media = MediaImage | MediaVideo;

export type TimeRange = {
  startTime: number;
  duration: number;
};

export type CropData = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export type ImageOrientation = 'DOWN' | 'LEFT' | 'RIGHT' | 'UP';

export type ImageEditionParameters = {
  brightness?: number | null;
  contrast?: number | null;
  highlights?: number | null;
  saturation?: number | null;
  shadow?: number | null;
  sharpness?: number | null;
  structure?: number | null;
  temperature?: number | null;
  tint?: number | null;
  vibrance?: number | null;
  vigneting?: number | null;
  pitch?: number | null;
  roll?: number | null;
  yaw?: number | null;
  cropData?: CropData | null;
  orientation?: ImageOrientation;
};
