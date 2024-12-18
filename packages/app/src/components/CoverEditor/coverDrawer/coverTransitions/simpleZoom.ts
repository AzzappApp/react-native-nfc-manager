import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
uniform shader imageOut;
uniform shader imageIn;
uniform float progress;
uniform float2 iResolution;
uniform float zoom_quickness;



vec2 zoom(vec2 uv, float amount) {
  return 0.5 + ((uv - 0.5) * (1.0 - amount));
}

vec4 main(vec2 uv) {
  float nQuick = clamp(zoom_quickness, 0.2, 1.0);
  uv /= iResolution;

  return mix(
    imageOut.eval(zoom(uv, smoothstep(0.0, nQuick, progress)) * iResolution),
    imageIn.eval(uv * iResolution),
    smoothstep(nQuick - 0.2, 1.0, progress)
  );
}
`);

const zoom_quickness = 0.5;

export default {
  id: 'simpleZoom' as const,
  transition: createTransition(effect, 0.5, { zoom_quickness }),
  duration: 0.5,
};
