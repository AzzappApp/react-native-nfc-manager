import { Skia } from '@shopify/react-native-skia';
import type { CoverEditorTransition } from '../coverEditorTypes';
import type { SkShader, SkCanvas } from '@shopify/react-native-skia';

export type TransitionDrawer = (args: {
  canvas: SkCanvas;
  shader: SkShader;
  time: number;
  width: number;
  height: number;
}) => void;

export type TransitionDefinition = {
  duration: number;
  drawer: TransitionDrawer;
};

const NONE_TRANSITION_DURATION = 0;
const noneTransitionDrawer: TransitionDrawer = ({ canvas, shader }) => {
  'worklet';
  const paint = Skia.Paint();
  paint.setShader(shader);
  canvas.drawPaint(paint);
};

const FADE_TRANSITION_DURATION = 0.5;
const fadeTransitionDrawer: TransitionDrawer = ({ canvas, shader, time }) => {
  'worklet';
  const duration = FADE_TRANSITION_DURATION;
  const alpha = Math.min(Math.abs(time), duration) / duration;
  const paint = Skia.Paint();
  paint.setShader(shader);
  paint.setAlphaf(alpha);
  canvas.drawPaint(paint);
};

const SLIDE_TRANSITION_DURATION = 0.5;
const slideTransitionDrawer: TransitionDrawer = ({
  canvas,
  shader,
  time,
  width,
  height,
}) => {
  'worklet';
  const duration = SLIDE_TRANSITION_DURATION;
  const progress = time / duration;
  let x: number;
  if (progress < 0) {
    x = -1 - progress;
  } else {
    x = 1 - progress;
  }
  canvas.save();
  const paint = Skia.Paint();
  paint.setShader(shader);
  canvas.translate(x * width, 0);
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

const coverTransitions: Record<CoverEditorTransition, TransitionDefinition> = {
  fade: {
    duration: FADE_TRANSITION_DURATION,
    drawer: fadeTransitionDrawer,
  },
  slide: {
    duration: SLIDE_TRANSITION_DURATION,
    drawer: slideTransitionDrawer,
  },
  none: {
    duration: NONE_TRANSITION_DURATION,
    drawer: noneTransitionDrawer,
  },
};

export default coverTransitions;
