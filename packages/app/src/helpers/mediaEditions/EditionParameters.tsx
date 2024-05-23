import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { createShaderApplier } from './shaderUtils';
import type { Icons } from '#ui/Icon';

/**
 * The parameters that can be used to edit the image/video
 * Displayed by a GPULayer
 */
export type EditionParameters = {
  /**
   * the amount of brightness to apply to the image
   */
  brightness?: number | null;
  /**
   * the amount of contrast to apply to the image
   */
  contrast?: number | null;
  /**
   * the amount of highlights to apply to the image iOS only
   * @platform ios
   */
  highlights?: number | null;
  /**
   * the amount of saturation to apply to the image
   */
  saturation?: number | null;
  /**
   * the amount of shadow to apply to the image
   * @platform ios
   */
  shadow?: number | null;
  /**
   * the amount of sharpness to apply to the image
   */
  sharpness?: number | null;
  /**
   * the amount of temperature to apply to the image
   */
  temperature?: number | null;
  /**
   * the amount of vibrance to apply to the image
   * @platform ios
   */
  vibrance?: number | null;
  /**
   * the amount of vignetting to apply to the image
   */
  vignetting?: number | null;
  /**
   * the amount of z centered rotation to apply to the image (in degrees)
   */
  roll?: number | null;
  /**
   * the crop applied to the image
   */
  cropData?: CropData | null;
  /**
   * the orientation change applied to the image
   */
  orientation?: ImageOrientation | null;
};

/**
 * Crop information for an image or video
 */
export type CropData = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export const KNOWN_ORIENTATIONS = ['DOWN', 'LEFT', 'RIGHT', 'UP'] as const;

/**
 * The orientation of an image or video
 */
export type ImageOrientation = (typeof KNOWN_ORIENTATIONS)[number];

export type ParametersSettings = {
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  interval?: number;
  displayedValues?: [number, number];
  ios?: boolean;
  android?: boolean;
};

/**
 * Information about the parameters used by Controls UI
 */
export const editionParametersSettings: ParametersInfo<ParametersSettings> = {
  brightness: {
    defaultValue: 0,
    min: -0.25,
    max: 0.25,
    step: 0.01,
    displayedValues: [-100, 100],
  },
  contrast: {
    defaultValue: 1,
    min: 0.5,
    max: 1.5,
    step: 0.025,
    displayedValues: [-100, 100],
  },
  highlights: {
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  saturation: {
    defaultValue: 1,
    min: 0,
    max: 2,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  shadow: {
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  sharpness: {
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  temperature: {
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  vibrance: {
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  vignetting: {
    defaultValue: 0,
    min: 0,
    max: 1,
    step: 0.02,
    displayedValues: [0, 100],
  },
  roll: {
    defaultValue: 0,
    min: -20,
    max: 20,
    step: 1,
    displayedValues: [-20, 20],
  },
};

type ParametersInfo<T> = Partial<Record<keyof EditionParameters, T>>;

/**
 * Localized information about the parameters used by Controls UI
 */
export const useEditionParametersDisplayInfos = (): ParametersInfo<{
  label: string;
  icon: Icons;
}> => {
  const intl = useIntl();
  return useMemo(
    () => ({
      cropData: {
        icon: 'crop',
        label: intl.formatMessage({
          defaultMessage: 'Crop',
          description: 'Crop image edition parameters name',
        }),
      },
      brightness: {
        icon: 'brightness',
        label: intl.formatMessage({
          defaultMessage: 'Brightness',
          description: 'Brightness image edition parameters name',
        }),
      },
      contrast: {
        icon: 'contrast',
        label: intl.formatMessage({
          defaultMessage: 'Contrast',
          description: 'Contrast image edition parameters name',
        }),
      },
      highlights: {
        icon: 'brightness',
        label: intl.formatMessage({
          defaultMessage: 'Highlights',
          description: 'Highlights image edition parameters name',
        }),
      },
      saturation: {
        icon: 'saturation',
        label: intl.formatMessage({
          defaultMessage: 'Saturation',
          description: 'Saturation image edition parameters name',
        }),
      },
      shadow: {
        icon: 'shadow',
        label: intl.formatMessage({
          defaultMessage: 'Shadow',
          description: 'Shadow image edition parameters name',
        }),
      },
      sharpness: {
        icon: 'sharpness',
        label: intl.formatMessage({
          defaultMessage: 'Sharpness',
          description: 'Sharpness image edition parameters name',
        }),
      },
      temperature: {
        icon: 'temperature',
        label: intl.formatMessage({
          defaultMessage: 'Warmth',
          description: 'Temperature/warmth image edition parameters name',
        }),
      },
      vibrance: {
        icon: 'vibrance',
        label: intl.formatMessage({
          defaultMessage: 'Vibrance',
          description: 'Vibrance image edition parameters name',
        }),
      },
      vignetting: {
        icon: 'vignetting',
        label: intl.formatMessage({
          defaultMessage: 'Vignette',
          description: 'Vignette image edition parameters name',
        }),
      },
    }),
    [intl],
  );
};

export const EditionParametersSkiaEffects = {
  brightness: createShaderApplier(`
    uniform float brightness;
    uniform shader image;
    float4 main(float2 uv) {
      float4 color = image.eval(uv);
      return float4(color.rgb + brightness, color.a);
    }
  `),
  contrast: createShaderApplier(`
    uniform float contrast;
    uniform shader image;
    float4 main(float2 uv) {
      float4 color = image.eval(uv);
      return float4((color.rgb - 0.5) * contrast + 0.5, color.a);
    }
  `),
  highlights: createShaderApplier(`
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
  shadow: createShaderApplier(`
    uniform shader image;
    uniform float shadows;

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
      float x1 = abs(shadows);
      float x2 = 1 - lum;
      float lum_new = lum > 0.5 ? lum : lum + a * sign(shadows) * 
        exp(-0.5 * (((x1-b)/c)*((x1-b)/c) + ((x2-d)/e)*((x2-d)/e)));
      return color * lum_new / lum;
    }
  `),
  saturation: createShaderApplier(`
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
  sharpness: createShaderApplier(`
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
  temperature: createShaderApplier(`
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
  vibrance: createShaderApplier(`
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
  vignetting: createShaderApplier(`
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
};
