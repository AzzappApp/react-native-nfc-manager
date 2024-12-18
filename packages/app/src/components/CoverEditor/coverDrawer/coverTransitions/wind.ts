import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
uniform shader imageOut;
uniform shader imageIn;
uniform float progress;
uniform float2 iResolution;
uniform float size; // = 0.2

float rand (float2 co) {
  return fract(sin(dot(co.xy ,float2(12.9898,78.233))) * 43758.5453);
}

half4 main(float2 uv) {
  uv /= iResolution;
  float r = rand(float2(0, uv.y));
  float m = smoothstep(0.0, -size, uv.x*(1.0-size) + size*r - (progress * (1.0 + size)));
  return mix(imageOut.eval(uv * iResolution), imageIn.eval(uv * iResolution), m);
}
`);
const duration = 0.5;

const size = 0.2;
export default {
  id: 'wind' as const,
  transition: createTransition(effect, duration, { size }),
  duration,
};
