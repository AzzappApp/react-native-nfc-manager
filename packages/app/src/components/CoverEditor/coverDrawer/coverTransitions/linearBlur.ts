import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
  uniform shader imageOut;
  uniform shader imageIn;
  uniform float progress;
  uniform float2 iResolution;
  uniform float intensity;

  const int passes = 6;

  vec4 main(vec2 uv) {
      uv /= iResolution;

      vec4 c1 = vec4(0.0);
      vec4 c2 = vec4(0.0);

      float disp = intensity * (0.5 - distance(0.5, progress));
      for (int xi = 0; xi < passes; xi++) {
          float x = float(xi) / float(passes) - 0.5;
          for (int yi = 0; yi < passes; yi++) {
              float y = float(yi) / float(passes) - 0.5;
              vec2 v = vec2(x, y);
              float d = disp;
              c1 += imageOut.eval((uv + d * v) * iResolution);
              c2 += imageIn.eval((uv + d * v) * iResolution);
          }
      }
      c1 /= float(passes * passes);
      c2 /= float(passes * passes);
      return mix(c1, c2, progress);
  }
`);
const duration = 0.5;
const intensity = 0.1;

export default {
  id: 'linearBlur' as const,
  transition: createTransition(effect, duration, { intensity }),
  duration,
};
