import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
uniform shader imageOut;
uniform shader imageIn;
uniform float progress;
uniform float2 iResolution;
uniform float smoothness;

vec4 main(float2 p) {
    float2 center = float2(0.5, 0.5);
    ivec2 squares = ivec2(10,10);
    vec2 direction = vec2(1.0, 1.0);

    p /= iResolution;
    float2 v = normalize(direction);
    v /= abs(v.x)+abs(v.y);
    float d = v.x * center.x + v.y * center.y;
    float offset = smoothness;
    float pr = smoothstep(-offset, 0.0, v.x * p.x + v.y * p.y - (d-0.5+progress*(1.+offset)));
    float2 squarep = fract(p*float2(squares));
    float2 squaremin = float2(pr/2.0);
    float2 squaremax = float2(1.0 - pr/2.0);
    float a = (1.0 - step(progress, 0.0)) * step(squaremin.x, squarep.x) * step(squaremin.y, squarep.y) * step(squarep.x, squaremax.x) * step(squarep.y, squaremax.y);
    return mix(imageOut.eval(p * iResolution), imageIn.eval(p * iResolution), a);
}
`);
const duration = 0.5;
const smoothness = 1.6;
export default {
  id: 'squaresWire' as const,
  transition: createTransition(effect, duration, { smoothness }),
  duration,
};
