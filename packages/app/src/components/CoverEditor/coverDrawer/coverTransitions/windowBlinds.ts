import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
uniform shader imageOut;
uniform shader imageIn;
uniform float progress;
uniform float2 iResolution;

vec4 main(float2 uv) {
    uv /= iResolution;
    float t = progress;
  
    if (mod(floor(uv.y*100.*progress),2.)==0.)
        t*=2.-.5;
  
    return mix(
        imageOut.eval(uv * iResolution),
        imageIn.eval(uv * iResolution),
        mix(t, progress, smoothstep(0.8, 1.0, progress))
    );
}

`);
const duration = 0.5;

export default {
  id: 'windowBlinds' as const,
  transition: createTransition(effect, duration),
  duration,
};
