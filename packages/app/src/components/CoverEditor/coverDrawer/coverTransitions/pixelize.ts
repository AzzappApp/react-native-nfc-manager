import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
  uniform shader imageOut;
  uniform shader imageIn;
  uniform float progress;
  uniform float2 iResolution;
  uniform float squaresMin;
  uniform float steps;

  vec4 main(vec2 uv) {
    uv /= iResolution;
    float d = min(progress, 1.0 - progress);
    float dist = steps>0 ? ceil(d * float(steps)) / float(steps) : d;
    float2 squareSize = 2.0 * dist / float2(squaresMin);

    float2 p = dist>0.0 ? (floor(uv / squareSize) + 0.5) * squareSize : uv;
    return mix(imageOut.eval(p * iResolution), imageIn.eval(p * iResolution), progress);
  }
 `);

const squaresMin = 20;
const steps = 50;
export default {
  id: 'pixelize' as const,
  transition: createTransition(effect, 0.5, { squaresMin, steps }),
  duration: 0.5,
};
