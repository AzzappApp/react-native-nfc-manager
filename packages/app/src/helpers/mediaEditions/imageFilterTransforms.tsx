import { Skia } from '@shopify/react-native-skia';
import type { TextureInfo } from './NativeTextureLoader';
import type { SkImage, SkImageFilter } from '@shopify/react-native-skia';

export const compileEffect = (source: string) =>
  process.env.JEST_WORKER_ID ? null : Skia.RuntimeEffect?.Make(source);

const createRuntimeShaderFactory = <
  T extends Record<string, number[] | number>,
>(
  source: string,
) => {
  const effect = compileEffect(source);
  const builder = effect ? Skia.RuntimeShaderBuilder(effect) : null;
  return (uniforms: T, previousFilter?: SkImageFilter | null) => {
    'worklet';
    if (!builder) {
      return null;
    }
    Object.entries(uniforms).forEach(([name, value]) => {
      builder.setUniform(name, Array.isArray(value) ? value : [value]);
    });
    return Skia.ImageFilter.MakeRuntimeShader(
      builder,
      'image',
      previousFilter ?? null,
    );
  };
};

const LUT_EFFECT = compileEffect(`
  uniform shader image;
  uniform shader lut;
   
  float lutSize = 64.0;

  float4 getLutColor(float x, float y, float z) {
    float lineIndex = floor(y / sqrt(lutSize));
    float colIndex = y - lineIndex * sqrt(lutSize);

    return lut.eval(
      float2(
        (x + colIndex * lutSize) + 0.5,
        (z * sqrt(lutSize) + lineIndex) + 0.5
      )
    );
  }

  float4 main(float2 xy) {
    float4 color = image.eval(xy);

    float x = color.r * (lutSize - 1.0);
    float y = color.g * (lutSize - 1.0);
    float z = color.b * (lutSize - 1.0);

    float4 c000 = getLutColor(floor(x), floor(y), floor(z));
    float4 c100 = getLutColor(ceil(x), floor(y), floor(z));
    float4 c010 = getLutColor(floor(x), ceil(y), floor(z));
    float4 c110 = getLutColor(ceil(x), ceil(y), floor(z));
    float4 c001 = getLutColor(floor(x), floor(y), ceil(z));
    float4 c101 = getLutColor(ceil(x), floor(y), ceil(z));
    float4 c011 = getLutColor(floor(x), ceil(y), ceil(z));
    float4 c111 = getLutColor(ceil(x), ceil(y), ceil(z));

    // Interpolation
    float4 c00 = mix(c000, c100, fract(x));
    float4 c10 = mix(c010, c110, fract(x));
    float4 c01 = mix(c001, c101, fract(x));
    float4 c11 = mix(c011, c111, fract(x));

    float4 c0 = mix(c00, c10, fract(y));
    float4 c1 = mix(c01, c11, fract(y));

    float4 lutColor = mix(c0, c1, fract(z));

    if (color.a == 0.0) {
        return color;
    }
    return float4(lutColor.rgb, color.a);
  }
`);

const imageFilterTransforms = {
  brightness: createRuntimeShaderFactory<{ brightness: number }>(`
    uniform float brightness;
    uniform shader image;
    float4 main(float2 uv) {
      float4 color = image.eval(uv);
      return float4(color.rgb + brightness, color.a);
    }
  `),
  contrast: createRuntimeShaderFactory<{ contrast: number }>(`
    uniform float contrast;
    uniform shader image;
    float4 main(float2 uv) {
      float4 color = image.eval(uv);
      return float4((color.rgb - 0.5) * contrast + 0.5, color.a);
    }
  `),
  highlights: createRuntimeShaderFactory<{ highlights: number }>(`
    uniform shader image;
    uniform float highlights;

    const float a = 1.357697966704323E-01;
    const float b = 1.006045552016985E+00;
    const float c = 4.674339906510876E-01;
    const float d = 8.029414702292208E-01;
    const float e = 1.127806558508491E-01;

    float4 main(float2 uv) {
      float4 color = image.eval(uv);
      float maxx = max(color.r, max(color.g, color.b));
      float minx = min(color.r, min(color.g, color.b));
      float lum = 0.5 * (maxx + minx);
      float x1 = abs(highlights);
      float x2 = lum;
      float lum_new =  lum < 0.5 ? lum : lum + a * sign(highlights) * 
        exp(-0.5 * (((x1-b)/c)*((x1-b)/c) + ((x2-d)/e)*((x2-d)/e)));
      return color * lum_new / lum;
    }
  `),
  shadow: createRuntimeShaderFactory<{ shadow: number }>(`
    uniform shader image;
    uniform float shadow;

    const float a = 1.357697966704323E-01;
    const float b = 1.006045552016985E+00;
    const float c = 4.674339906510876E-01;
    const float d = 8.029414702292208E-01;
    const float e = 1.127806558508491E-01;

    float4 main(float2 uv) {
      float4 color = image.eval(uv);
      float maxx = max(color.r, max(color.g, color.b));
      float minx = min(color.r, min(color.g, color.b));
      float lum = 0.5 * (maxx + minx);
      float x1 = abs(shadow);
      float x2 = 1 - lum;
      float lum_new = lum > 0.5 ? lum : lum + a * sign(shadow) * 
        exp(-0.5 * (((x1-b)/c)*((x1-b)/c) + ((x2-d)/e)*((x2-d)/e)));
      return color * lum_new / lum;
    }
  `),
  saturation: createRuntimeShaderFactory<{ saturation: number }>(`
    uniform shader image;
    uniform float saturation;

    const float3 luminanceWeighting = float3(0.2125, 0.7154, 0.0721);
    float4 main(float2 uv) {
      float sat = max(saturation, 0.0);
      float4 color = image.eval(uv);
      float luminance = dot(color.rgb, luminanceWeighting);
      float3 greyScaleColor = float3(luminance);
      return float4(mix(greyScaleColor, color.rgb, sat), color.a);
    }
  `),
  sharpness: createRuntimeShaderFactory<{ sharpness: number }>(`
    uniform shader image;
    uniform float sharpness;
    const float decal = 1.5;

    float4 main(float2 uv) {
      float4 color = image.eval(uv);

      float3 texA = image.eval(float2(max(uv.x - decal, 0),  max(uv.y - decal, 0))).rgb;
      float3 texB = image.eval(float2(uv.x + decal,  max(uv.y - decal, 0))).rgb;
      float3 texC = image.eval(float2(max(uv.x - decal, 0),  uv.y + decal)).rgb;
      float3 texD = image.eval(float2(uv.x + decal,  uv.y + decal)).rgb;
      
      float3 around = 0.25 * (texA + texB + texC + texD);
      float3 center = color.rgb;
      float3 col = center + (center - around) * sharpness;

      return vec4(col, color.a);
    }
  `),
  temperature: createRuntimeShaderFactory<{ temperature: number }>(`
    uniform shader image;
    uniform float temperature;

    // Valid from 1000 to 40000 K (and additionally 0 for pure full white)
    float3 colorTemperatureToRGB(const in float temperature){
      // Values from: http://blenderartists.org/forum/showthread.php?270332-OSL-Goodness&p=2268693&viewfull=1#post2268693
      mat3 m = (temperature <= 6500.0) ? mat3(float3(0.0, -2902.1955373783176, -8257.7997278925690),
      float3(0.0, 1669.5803561666639, 2575.2827530017594),
      float3(1.0, 1.3302673723350029, 1.8993753891711275)) :
      mat3(float3(1745.0425298314172, 1216.6168361476490, -8257.7997278925690),
      float3(-2666.3474220535695, -2173.1012343082230, 2575.2827530017594),
      float3(0.55995389139931482, 0.70381203140554553, 1.8993753891711275));
      return mix(
          clamp(float3(m[0] / (float3(clamp(temperature, 1000.0, 40000.0)) + m[1]) + m[2]),
          float3(0.0), float3(1.0)), float3(1.0), smoothstep(1000.0, 0.0, temperature)
      );
    }

    
    float4 main(float2 uv) {
      float temperatureStrength = 0.75;
    
      vec4 texColor = image.eval(uv);
      
      return vec4(
        texColor.rgb / colorTemperatureToRGB(temperature),
        texColor.a
      );
    }
  `),
  vibrance: createRuntimeShaderFactory<{ vibrance: number }>(`
    uniform shader image;
    uniform float vibrance;

    const float3 luminanceWeighting = float3(0.2125, 0.7154, 0.0721);

    float4 main(float2 uv) {
      vec4 col = image.eval(uv);
      vec3 color = col.rgb;
      float luminance = dot(color, luminanceWeighting);
      float mn = min(min(color.r, color.g), color.b);
      float mx = max(max(color.r, color.g), color.b);
      float sat = (1.0-(mx - mn)) * (1.0-mx) * luminance * 5.0;
      vec3 lightness = vec3((mn + mx)/2.0);

      // vibrance
      color = mix(color, mix(color, lightness, -vibrance * 2.0), sat);
      // negative vibrance
      color = mix(color, lightness, (1.0-lightness)*(1.0-vibrance)/2.0*abs(vibrance));

      return float4(color.rgb, col.a);
    }
  `),
  vignetting: createRuntimeShaderFactory<{
    vignetting: number;
    iResolution: number[];
  }>(`
    uniform shader image;
    uniform float vignetting;
    uniform float2 iResolution; 
  
    float4 main(float2 uv) {
      float4 texColor = image.eval(uv);
      float3 color = texColor.rgb;
      float darkness = vignetting / 2.0;
      float offset = vignetting / 2.0;
      
      float2 normalizedUV = uv / iResolution;

      color *= smoothstep(
        0.8, 
        offset * 0.799, 
        distance(normalizedUV, vec2(0.5, 0.5)) * (darkness + offset)
      );

      return vec4(color, texColor.a);
    }
  `),
  lut: (lutTexture: TextureInfo, previousFilter?: SkImageFilter | null) => {
    'worklet';
    const shaderBuilder = LUT_EFFECT
      ? Skia.RuntimeShaderBuilder(LUT_EFFECT)
      : null;
    if (!shaderBuilder) {
      return null;
    }
    const makeImageFilter: (image: SkImage) => SkImageFilter = image =>
      Skia.ImageFilter.MakeImage(image);
    const filter = Skia.ImageFilter.MakeRuntimeShaderWithChildren(
      shaderBuilder,
      ['image', 'lut'],
      [
        previousFilter ?? null,
        makeImageFilter(
          Skia.Image.MakeImageFromNativeTextureUnstable(
            lutTexture.texture,
            lutTexture.width,
            lutTexture.height,
          ),
        ),
      ],
    ) as SkImageFilter;
    return filter;
  },
};

export default imageFilterTransforms;
