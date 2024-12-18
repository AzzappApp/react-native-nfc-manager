import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
uniform shader imageOut;
uniform shader imageIn;
uniform float progress;
uniform float2 iResolution;

vec4 main(vec2 uv) {
    uv /= iResolution;
    return mix(imageOut.eval(uv * iResolution), imageIn.eval(uv * iResolution), progress);
}
`);
const duration = 0.5;

export default {
  id: 'fade' as const,
  transition: createTransition(effect, duration),
  duration,
};
