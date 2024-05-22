export type CustomDimensionsType = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ReziseHandlePosition = 'bottom' | 'left' | 'right' | 'top';
export type ResizeAxis = 'x' | 'y';
export type ResizeHandleAxis = ResizeAxis[];

export type WorkspaceLimits = {
  width: number;
  height: number;
};
