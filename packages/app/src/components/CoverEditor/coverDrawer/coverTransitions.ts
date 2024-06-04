import { Skia } from '@shopify/react-native-skia';
import { useIntl } from 'react-intl';
import { interpolate } from 'react-native-reanimated';
import { compileEffect } from '#helpers/mediaEditions/shaderUtils';
import type { SkShader, SkCanvas } from '@shopify/react-native-skia';

export type CoverTransition = (args: {
  canvas: SkCanvas;
  inShader: SkShader;
  outShader: SkShader;
  time: number;
  width: number;
  height: number;
}) => void;

const fadeDuration = 0.5;
const fadeTransition: CoverTransition = ({
  canvas,
  inShader,
  outShader,
  time,
}) => {
  'worklet';
  const progress = time / fadeDuration;
  const paint = Skia.Paint();
  paint.setShader(outShader);
  paint.setAlphaf(1 - progress);
  canvas.drawPaint(paint);
  paint.setShader(inShader);
  paint.setAlphaf(progress);
  canvas.drawPaint(paint);
};

const wipeRightDuration = 0.5;
const wipeRightTransition: CoverTransition = ({
  canvas,
  inShader,
  outShader,
  time,
  width,
  height,
}) => {
  'worklet';
  const progress = time / wipeRightDuration;
  const paint = Skia.Paint();
  paint.setShader(inShader);
  canvas.drawRect(
    {
      x: 0,
      y: 0,
      width,
      height,
    },
    paint,
  );
  canvas.save();
  paint.setShader(outShader);
  canvas.drawRect(
    {
      x: 0,
      y: 0,
      width: width - progress * width,
      height,
    },
    paint,
  );
  canvas.restore();
};

const zoomDuration = 0.5;
const zoomTransition: CoverTransition = ({
  canvas,
  inShader,
  outShader,
  time,
  width,
  height,
}) => {
  'worklet';
  const progress = time / zoomDuration;
  const paint = Skia.Paint();
  paint.setShader(inShader);
  canvas.drawPaint(paint);

  paint.setShader(outShader);
  paint.setAlphaf(interpolate(progress, [0, 0.4, 1], [1, 1, 0]));
  const zoom = 1 + progress * 9;
  canvas.save();
  canvas.scale(zoom, zoom);
  canvas.translate(
    width / 2 / zoom - width / 2,
    height / 2 / zoom - height / 2,
  );
  canvas.drawRect(
    {
      x: 0,
      y: 0,
      width,
      height,
    },
    paint,
  );
  canvas.restore();
};

const slideDuration = 0.5;
const slideTransitionFactory =
  (direction: 'bottom' | 'left' | 'right' | 'top'): CoverTransition =>
  ({ canvas, inShader, outShader, time, width, height }) => {
    'worklet';
    const progress = time / slideDuration;
    const paint = Skia.Paint();

    paint.setShader(outShader);
    canvas.save();
    canvas.translate(
      direction === 'right'
        ? -progress * width
        : direction === 'left'
          ? progress * width
          : 0,
      direction === 'bottom'
        ? -progress * height
        : direction === 'top'
          ? progress * height
          : 0,
    );
    canvas.drawRect(
      {
        x: 0,
        y: 0,
        width,
        height,
      },
      paint,
    );
    canvas.restore();

    paint.setShader(inShader);
    canvas.save();
    canvas.translate(
      direction === 'right'
        ? width - progress * width
        : direction === 'left'
          ? -width + progress * width
          : 0,
      direction === 'bottom'
        ? height - progress * height
        : direction === 'top'
          ? -height + progress * height
          : 0,
    );
    canvas.drawRect(
      {
        x: 0,
        y: 0,
        width,
        height,
      },
      paint,
    );
    canvas.restore();
  };

const windowSliceEffect = compileEffect(`
  uniform shader imageOut;
  uniform shader imageIn;
  uniform float progress;
  uniform float2 iResolution; 

  float count = 10.0;
  float smoothness = 0.5;

  vec4 main(vec2 uv) {
    float2 p = uv / iResolution;
    float pr = smoothstep(-smoothness, 0.0, p.x - progress * (1.0 + smoothness));
    float s = step(pr, fract(count * p.x));
    return mix(imageOut.eval(uv), imageIn.eval(uv), s);
  }
`);

export const windowSliceTransition: CoverTransition = ({
  canvas,
  inShader,
  outShader,
  time,
  width,
  height,
}) => {
  'worklet';
  const progress = time / fadeDuration;
  const paint = Skia.Paint();
  const shader = windowSliceEffect?.makeShaderWithChildren(
    [progress, width, height],
    [outShader, inShader],
    Skia.Matrix(),
  );
  if (!shader) {
    console.error('no shader');
    return;
  }
  paint.setShader(shader);
  canvas.drawPaint(paint);
};

const coverTransitions = {
  fade: { transition: fadeTransition, duration: fadeDuration },
  slideRight: {
    transition: slideTransitionFactory('right'),
    duration: slideDuration,
  },
  slideBottom: {
    transition: slideTransitionFactory('bottom'),
    duration: slideDuration,
  },
  slideLeft: {
    transition: slideTransitionFactory('left'),
    duration: slideDuration,
  },
  slideTop: {
    transition: slideTransitionFactory('top'),
    duration: slideDuration,
  },
  wipeRight: { transition: wipeRightTransition, duration: wipeRightDuration },
  zoom: { transition: zoomTransition, duration: zoomDuration },
  windowSliceEffect: {
    transition: windowSliceTransition,
    duration: fadeDuration,
  },
} as const;

export type CoverTransitions = keyof typeof coverTransitions;

export default coverTransitions;

export type CoverTransitionsListItem = {
  label: string;
  id: CoverTransitions;
};

export function useCoverTransitionsList() {
  const intl = useIntl();
  //i need to define all those code.....(and cannot use param in the render item)..; kind of ulgy
  return [
    {
      id: 'fade',
      label: intl.formatMessage({
        defaultMessage: 'Fade',
        description: 'Cover Edition Transition - Fade',
      }),
    },
    {
      id: 'slideRight',
      label: intl.formatMessage({
        defaultMessage: 'Slide right',
        description: 'Cover Edition Transition - Slide right',
      }),
    },
    {
      id: 'slideBottom',
      label: intl.formatMessage({
        defaultMessage: 'Slide bottom',
        description: 'Cover Edition Transition - Slide bottom',
      }),
    },
    {
      id: 'slideLeft',
      label: intl.formatMessage({
        defaultMessage: 'Slide left',
        description: 'Cover Edition Transition - Slide left',
      }),
    },
    {
      id: 'slideTop',
      label: intl.formatMessage({
        defaultMessage: 'Slide top',
        description: 'Cover Edition Transition - Slide top',
      }),
    },
    {
      id: 'wipeRight',
      label: intl.formatMessage({
        defaultMessage: 'Wipe right',
        description: 'Cover Edition Transition - Wipe right',
      }),
    },
    {
      id: 'zoom',
      label: intl.formatMessage({
        defaultMessage: 'Zoom',
        description: 'Cover Edition Transition - Zoom',
      }),
    },
    {
      id: 'windowSliceEffect',
      label: intl.formatMessage({
        defaultMessage: 'Window slice',
        description: 'Cover Edition Transition - Window slice',
      }),
    },
  ] as const;
}
