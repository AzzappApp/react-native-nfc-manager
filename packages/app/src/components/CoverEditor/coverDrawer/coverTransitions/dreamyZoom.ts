import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
uniform shader imageOut;
uniform shader imageIn;
uniform float progress;
uniform float2 iResolution;
uniform float rotation;
uniform float scale;

const float DEG2RAD = 0.03926990816987241548078304229099;

vec4 main(vec2 uv) {
    uv /= iResolution;

    float phase = progress < 0.5 ? progress * 2.0 : (progress - 0.5) * 2.0;
    float angleOffset = progress < 0.5 ? mix(0.0, rotation * DEG2RAD, phase) : mix(-rotation * DEG2RAD, 0.0, phase);
    float newScale = progress < 0.5 ? mix(1.0, scale, phase) : mix(scale, 1.0, phase);

    vec2 center = vec2(0, 0);
    vec2 p = (uv.xy - vec2(0.5, 0.5)) / newScale * vec2(iResolution.x / iResolution.y, 1.0);

    float angle = atan(p.y, p.x) + angleOffset;
    float dist = distance(center, p);
    p.x = cos(angle) * dist * iResolution.y / iResolution.x + 0.5;
    p.y = sin(angle) * dist + 0.5;
    vec4 c = progress < 0.5 ? imageOut.eval(p * iResolution) : imageIn.eval(p * iResolution);

    return c + (progress < 0.5 ? mix(0.0, 1.0, phase) : mix(1.0, 0.0, phase));
}

`);
const duration = 0.5;
const rotation = 6;
const scale = 1.2;

export default {
  id: 'dreamyZoom' as const,
  transition: createTransition(effect, duration, { rotation, scale }),
  duration,
};
