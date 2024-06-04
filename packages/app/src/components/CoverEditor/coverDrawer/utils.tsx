export const createRRect = (width: number, height: number, radius: number) => {
  'worklet';
  return {
    rect: {
      x: 0,
      y: 0,
      width,
      height,
    },
    rx: (radius * width) / 200,
    ry: (radius * width) / 200,
  };
};

export const convertToBaseCanvasRatio = (
  value: number,
  canvasWidth: number,
) => {
  'worklet';
  return value * (canvasWidth / 300);
};
