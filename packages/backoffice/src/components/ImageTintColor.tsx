import * as React from 'react';
import type { ReactElement } from 'react';
const { memo, useEffect, useRef, useState } = React;

type IconTintProps = {
  fallback?: ReactElement;
  src: string;
  color?: string;
  style?: React.CSSProperties;
  width: number;
  height: number;
};

// QUICK N DIRTY TINTING
const IconTint: React.FunctionComponent<IconTintProps> = ({
  fallback = <span />,
  src,
  color,
  width,
  height,
  ...props
}) => {
  const [stateSrc, setStateSrc] = useState<string>(src);
  useEffect(() => {
    setStateSrc(src);
  }, [src]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const { current: canvas } = canvasRef;
    const pic = new Image();
    if (color && canvas) {
      pic.src = stateSrc;
      const tintCanvas = document.createElement('canvas');
      const tintCtx = tintCanvas.getContext('2d');

      const ctx = canvas.getContext('2d');
      if (tintCtx && ctx) {
        pic.onload = () => {
          // Clear previous render
          tintCtx.clearRect(0, 0, width, height);
          ctx.clearRect(0, 0, width, height);

          tintCanvas.width = width;
          tintCanvas.height = height;
          tintCtx.fillStyle = color;
          tintCtx.fillRect(0, 0, width, height);
          tintCtx.globalCompositeOperation = 'destination-atop';
          tintCtx.drawImage(pic, 0, 0, width, height);
          ctx.globalAlpha = 1;
          ctx.drawImage(tintCanvas, 0, 0, width, height);
        };
      }
    }
  }, [stateSrc, color, width, height]);
  if (color == null) {
    return <img src={stateSrc} {...props} />;
  }

  if (typeof window !== 'undefined' && window.document) {
    return <canvas width={width} height={height} ref={canvasRef} {...props} />;
  }
  return fallback;
};

export default memo(IconTint);
