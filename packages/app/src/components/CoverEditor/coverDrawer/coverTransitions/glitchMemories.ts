import { compileEffect } from '#helpers/mediaEditions';
import { createTransition } from './createTransition';

const effect = compileEffect(`
uniform shader imageOut;
uniform shader imageIn;
uniform float progress;
uniform float2 iResolution;

vec4 main(vec2 p) {
    p /= iResolution;
    vec2 block = floor(p.xy * vec2(16.0));
    vec2 uv_noise = block / vec2(64.0);
    uv_noise += floor(vec2(progress) * vec2(1200.0, 3500.0)) / vec2(64.0);
    vec2 dist = progress > 0.0 ? (fract(uv_noise) - 0.5) * 0.3 *(1.0 -progress) : vec2(0.0);
    vec2 red = p + dist * 0.2;
    vec2 green = p + dist * .3;
    vec2 blue = p + dist * .5;

    return vec4(
        mix(imageOut.eval(red * iResolution), imageIn.eval(red * iResolution), progress).r,
        mix(imageOut.eval(green * iResolution), imageIn.eval(green * iResolution), progress).g,
        mix(imageOut.eval(blue * iResolution), imageIn.eval(blue * iResolution), progress).b,
        1.0
    );
}
`);
const duration = 0.5;

export default {
  id: 'glitchMemories' as const,
  transition: createTransition(effect, duration),
  duration,
};
