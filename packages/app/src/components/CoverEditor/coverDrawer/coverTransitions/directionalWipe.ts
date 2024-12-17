import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
  uniform shader imageOut;
  uniform shader imageIn;
  uniform float progress;
  uniform float2 iResolution;

  vec2 direction = vec2(0.5, 0.5);
  float smoothness = 0.5;

  vec4 main(vec2 uv) {
    uv /= iResolution;

    vec2 center = vec2(0.5, 0.5);
    vec2 v = normalize(direction);
    v /= abs(v.x) + abs(v.y);
    float d = v.x * center.x + v.y * center.y;
    float m =
      (1.0 - step(progress, 0.0)) *
      (1.0 - smoothstep(-smoothness, 0.0, v.x * uv.x + v.y * uv.y - (d - 0.5 + progress * (1.0 + smoothness))));

    return mix(imageOut.eval(uv * iResolution), imageIn.eval(uv * iResolution), m);
  }
  `);
const duration = 0.5;
export default {
  id: 'directionalWipe' as const,
  transition: createTransition(effect, duration),
  duration,
};
