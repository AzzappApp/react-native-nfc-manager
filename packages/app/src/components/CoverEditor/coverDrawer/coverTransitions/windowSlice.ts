import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
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

export default {
  id: 'windowSlice' as const,
  transition: createTransition(effect, 0.5),
  duration: 0.5,
};
