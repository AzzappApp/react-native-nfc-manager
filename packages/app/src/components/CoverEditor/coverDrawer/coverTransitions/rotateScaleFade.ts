import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
  uniform shader imageOut;
  uniform shader imageIn;
  uniform float progress;
  uniform float2 iResolution;

  vec2 center = vec2(0.5, 0.5);
  float rotations = 1.0;
  float scale = 8.0;
  vec4 backColor = vec4(0.15, 0.15, 0.15, 1.0);

  vec4 main(vec2 uv) {
    uv /= iResolution;

    vec2 difference = uv - center;
    vec2 dir = normalize(difference);
    float dist = length(difference);

    float angle = 2.0 * 3.14159265359 * rotations * progress;

    float c = cos(angle);
    float s = sin(angle);

    float currentScale = mix(scale, 1.0, 2.0 * abs(progress - 0.5));

    vec2 rotatedDir = vec2(dir.x * c - dir.y * s, dir.x * s + dir.y * c);
    vec2 rotatedUv = center + rotatedDir * dist / currentScale;

    if (rotatedUv.x < 0.0 || rotatedUv.x > 1.0 || rotatedUv.y < 0.0 || rotatedUv.y > 1.0)
      return backColor;

    return mix(imageOut.eval(rotatedUv * iResolution), imageIn.eval(rotatedUv * iResolution), progress);
  }
 `);

export default {
  id: 'rotateScaleFade' as const,
  transition: createTransition(effect, 0.5),
  duration: 0.5,
};
