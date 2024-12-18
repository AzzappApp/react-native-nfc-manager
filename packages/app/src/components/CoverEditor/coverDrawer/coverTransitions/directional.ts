import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
  uniform shader imageOut;
  uniform shader imageIn;
  uniform float progress;
  uniform float2 iResolution;
  uniform float x;
  uniform float y;

  vec4 main(vec2 uv) {
    uv /= iResolution;
    vec2 direction = vec2(x, y);
    vec2 p = uv + progress * sign(direction);
    vec2 f = fract(p);
    return mix(
      imageIn.eval(f * iResolution),
      imageOut.eval(f * iResolution),
      step(0.0, p.y) * step(p.y, 1.0) * step(0.0, p.x) * step(p.x, 1.0)
    );
  }
`);
const duration = 0.5;

export const directionalRight = {
  id: 'directionalRight' as const,
  transition: createTransition(effect, duration, { x: -1, y: 0 }),
  duration,
};

export const directionalLeft = {
  id: 'directionalLeft' as const,
  transition: createTransition(effect, duration, { x: 1, y: 0 }),
  duration,
};

export const directionalUp = {
  id: 'directionalUp' as const,
  transition: createTransition(effect, duration, { x: 0, y: 1 }),
  duration,
};

export const directionalDown = {
  id: 'directionalDown' as const,
  transition: createTransition(effect, duration, { x: 0, y: -1 }),
  duration,
};
