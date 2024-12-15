import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
uniform shader imageOut;
uniform shader imageIn;
uniform float progress;
uniform float2 iResolution;

vec4 main(float2 uv) {
    uv /= iResolution;
    float2 p = uv.xy / float2(1.0).xy;
    vec4 a = imageOut.eval(p * iResolution);
    vec4 b = imageIn.eval(p * iResolution);
     return mix(a, b, step(0.0+p.y,progress));
}
`);
const duration = 0.5;

export default {
  id: 'wipeUp' as const,
  transition: createTransition(effect, duration),
  duration,
};
