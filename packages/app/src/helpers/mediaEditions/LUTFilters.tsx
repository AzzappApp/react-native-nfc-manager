import {
  FilterMode,
  MipmapMode,
  Skia,
  TileMode,
  loadData,
} from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Image } from 'react-native';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import { compileEffect } from './shaderUtils';
import type { Filter } from '@azzapp/shared/filtersHelper';
import type { SkShader } from '@shopify/react-native-skia';
import type { ImageSourcePropType } from 'react-native';

const getUri = (source: ImageSourcePropType) =>
  // question mark for jest
  Image.resolveAssetSource(source)?.uri;

export const FILTERS: Record<Filter, any> = {
  nah: require('./assets/nah.png'),
  once: require('./assets/once.png'),
  passing_by: require('./assets/passing_by.png'),
  serenity: require('./assets/serenity.png'),
  solar: require('./assets/solar.png'),
  undeniable: require('./assets/undeniable.png'),
  undeniable2: require('./assets/undeniable2.png'),
  you_can_do_it: require('./assets/you_can_do_it.png'),
  pure: require('./assets/pure.png'),
  syrah: require('./assets/syrah.png'),
  paper: require('./assets/paper.png'),
  rock: require('./assets/rock.png'),
  vouzon: require('./assets/vouzon.png'),
  // BIG UP @mlecoq
  transparency: require('./assets/transparency.png'),
  autumn: require('./assets/autumn.png'),
  one_of_us: require('./assets/one_of_us.png'),
  bourbon: require('./assets/bourbon.png'),
  black_and_white_light: require('./assets/black_and_white_light.png'),
  black_and_white_neutral: getUri(
    require('./assets/black_and_white_neutral.png'),
  ),
  black_and_white_old: require('./assets/black_and_white_old.png'),
} as const;

// create an array to have filter in the same order as the designer want
export const useOrdonedFilters = (): Array<{
  id: Filter | 'none';
  label: string;
}> => {
  const intl = useIntl();
  return [
    {
      id: 'none',
      label: intl.formatMessage({
        defaultMessage: 'None',
        description: 'None filter name',
      }),
    },
    {
      id: 'nah',
      label: intl.formatMessage({
        defaultMessage: 'Nah',
        description: 'Nah filter name',
      }),
    },
    {
      id: 'once',
      label: intl.formatMessage({
        defaultMessage: 'Once',
        description: 'Once filter name',
      }),
    },
    {
      id: 'passing_by',
      label: intl.formatMessage({
        defaultMessage: 'Passing by',
        description: 'Passing by filter name',
      }),
    },
    {
      id: 'serenity',
      label: intl.formatMessage({
        defaultMessage: 'Serenity',
        description: 'Serenity filter name',
      }),
    },
    {
      id: 'solar',
      label: intl.formatMessage({
        defaultMessage: 'Solar',
        description: 'Solar filter name',
      }),
    },
    {
      id: 'undeniable',
      label: intl.formatMessage({
        defaultMessage: 'Undeniable',
        description: 'Undeniable filter name',
      }),
    },
    {
      id: 'undeniable2',
      label: intl.formatMessage({
        defaultMessage: 'Undeniable 2',
        description: 'Undeniable 2 filter name',
      }),
    },
    {
      id: 'you_can_do_it',
      label: intl.formatMessage({
        defaultMessage: 'You can do it',
        description: 'You can do it filter name',
      }),
    },
    {
      id: 'pure',
      label: intl.formatMessage({
        defaultMessage: 'Pure',
        description: 'Pure filter name',
      }),
    },
    {
      id: 'syrah',
      label: intl.formatMessage({
        defaultMessage: 'Syrah',
        description: 'Syrah filter name',
      }),
    },
    {
      id: 'paper',
      label: intl.formatMessage({
        defaultMessage: 'Paper',
        description: 'Paper filter name',
      }),
    },
    {
      id: 'rock',
      label: intl.formatMessage({
        defaultMessage: 'Rock',
        description: 'Rock filter name',
      }),
    },
    {
      id: 'vouzon',
      label: intl.formatMessage({
        defaultMessage: 'Vouzon',
        description: 'Vouzon filter name',
      }),
    },
    // BIG UP @mlecoq
    {
      id: 'transparency',
      label: intl.formatMessage({
        defaultMessage: 'Transparency',
        description: 'Transparency filter name',
      }),
    },
    {
      id: 'autumn',
      label: intl.formatMessage({
        defaultMessage: 'Autumn',
        description: 'Autaumn filter name',
      }),
    },
    {
      id: 'one_of_us',
      label: intl.formatMessage({
        defaultMessage: 'One of us',
        description: 'One of us filter name',
      }),
    },
    {
      id: 'bourbon',
      label: intl.formatMessage({
        defaultMessage: 'Bourbon',
        description: 'Bourbon filter name',
      }),
    },
    {
      id: 'black_and_white_light',
      label: intl.formatMessage({
        defaultMessage: 'B&W light',
        description: 'B&W light filter name',
      }),
    },
    {
      id: 'black_and_white_neutral',
      label: intl.formatMessage({
        defaultMessage: 'B&W neutral',
        description: 'B&W neutral filter name',
      }),
    },
    {
      id: 'black_and_white_old',
      label: intl.formatMessage({
        defaultMessage: 'B&W old',
        description: 'B&W old filter name',
      }),
    },
  ] as const;
};

//TODO: depreacted this one and une an array for ordonned filter
export const useFilterLabels = (): Record<Filter, string> => {
  const intl = useIntl();
  return useMemo(
    () => ({
      nah: intl.formatMessage({
        defaultMessage: 'Nah',
        description: 'Nah filter name',
      }),
      once: intl.formatMessage({
        defaultMessage: 'Once',
        description: 'Once filter name',
      }),
      passing_by: intl.formatMessage({
        defaultMessage: 'Passing by',
        description: 'Passing by filter name',
      }),
      serenity: intl.formatMessage({
        defaultMessage: 'Serenity',
        description: 'Serenity filter name',
      }),
      solar: intl.formatMessage({
        defaultMessage: 'Solar',
        description: 'Solar filter name',
      }),
      undeniable: intl.formatMessage({
        defaultMessage: 'Undeniable',
        description: 'Undeniable filter name',
      }),
      undeniable2: intl.formatMessage({
        defaultMessage: 'Undeniable 2',
        description: 'Undeniable 2 filter name',
      }),
      you_can_do_it: intl.formatMessage({
        defaultMessage: 'You can do it',
        description: 'You can do it filter name',
      }),
      pure: intl.formatMessage({
        defaultMessage: 'Pure',
        description: 'Pure filter name',
      }),
      syrah: intl.formatMessage({
        defaultMessage: 'Syrah',
        description: 'Syrah filter name',
      }),
      paper: intl.formatMessage({
        defaultMessage: 'Paper',
        description: 'Paper filter name',
      }),
      rock: intl.formatMessage({
        defaultMessage: 'Rock',
        description: 'Rock filter name',
      }),
      vouzon: intl.formatMessage({
        defaultMessage: 'Vouzon',
        description: 'Vouzon filter name',
      }),
      // BIG UP @mlecoq
      transparency: intl.formatMessage({
        defaultMessage: 'Transparency',
        description: 'Transparency filter name',
      }),
      autumn: intl.formatMessage({
        defaultMessage: 'Autumn',
        description: 'Autaumn filter name',
      }),
      one_of_us: intl.formatMessage({
        defaultMessage: 'One of us',
        description: 'One of us filter name',
      }),
      bourbon: intl.formatMessage({
        defaultMessage: 'Bourbon',
        description: 'Bourbon filter name',
      }),
      black_and_white_light: intl.formatMessage({
        defaultMessage: 'B&W light',
        description: 'B&W light filter name',
      }),
      black_and_white_neutral: intl.formatMessage({
        defaultMessage: 'B&W neutral',
        description: 'B&W neutral filter name',
      }),
      black_and_white_old: intl.formatMessage({
        defaultMessage: 'B&W old',
        description: 'B&W old filter name',
      }),
    }),
    [intl],
  );
};

const lutShaderCache = new Map<Filter, SkShader>();

export const getLutShader = (filter: Filter) => {
  if (process.env.JEST_WORKER_ID) {
    return Promise.resolve(null);
  }
  if (lutShaderCache.has(filter)) {
    return Promise.resolve(lutShaderCache.get(filter)!);
  }
  const filterImage = FILTERS[filter];
  if (!filterImage) {
    console.warn(`Unknown filter ${filter}`);
    return Promise.resolve(null);
  }
  return loadData(
    filterImage,
    Skia.Image.MakeImageFromEncoded.bind(Skia.Image),
  ).then(image => {
    const shader = image?.makeShaderOptions(
      TileMode.Clamp,
      TileMode.Clamp,
      FilterMode.Nearest,
      MipmapMode.None,
      Skia.Matrix(),
    );
    if (shader) {
      lutShaderCache.set(filter, shader);
    }
    return shader ?? null;
  });
};

export const loadAllLUTShaders = async () => {
  const record: Record<Filter, SkShader> = {} as any;
  const shaders = await Promise.all(
    typedEntries(FILTERS).map(async ([filter]) => ({
      filter,
      shader: await getLutShader(filter),
    })),
  );
  shaders.forEach(({ filter, shader }) => {
    if (shader) {
      record[filter] = shader;
    }
  });
  return record;
};

export const preloadLUTShaders = () => {
  for (const filter of Object.keys(FILTERS) as Filter[]) {
    getLutShader(filter).catch(err =>
      console.warn(`Could not preload shader for ${filter}`, err),
    );
  }
};

export const useLutShader = (
  filter: Filter | null | undefined,
  onError?: (err: Error) => void,
) => {
  const [lutShader, setLutShader] = useState<SkShader | null>(null);
  useMemo(() => {
    if (filter) {
      getLutShader(filter)
        .then(shader => setLutShader(shader))
        .catch(onError);
    } else {
      setLutShader(null);
    }
  }, [filter, onError, setLutShader]);

  return lutShader;
};

const ColorLUTEffect = compileEffect(`
  uniform shader image;
  uniform shader lut;

  float lutSize = 64.0;

  float4 getLutColor(float x, float y, float z) {
    float lineIndex = floor(y / sqrt(lutSize));
    float colIndex = y - lineIndex * sqrt(lutSize);

    return lut.eval(
      float2(
        (x + colIndex * lutSize),
        (z * sqrt(lutSize) + lineIndex)
      )
    );
  }

  float4 main(float2 xy) {
    float4 color = image.eval(xy);

    float x = color.r * (lutSize - 1.0);
    float y = color.g * (lutSize - 1.0);
    float z = color.b * (lutSize - 1.0);
    
    vec4 lutColor = mix( 
      mix(
        mix(
          getLutColor(floor(x), floor(y), floor(z)),
          getLutColor(ceil(x), floor(y), floor(z)),
          fract(x)
        ),
        mix(
          getLutColor(floor(x), ceil(y), floor(z)),
          getLutColor(ceil(x), ceil(y), floor(z)),
          fract(x)
        ),
        fract(y)
      ),
      mix(
        mix(
          getLutColor(floor(x), floor(y), ceil(z)),
          getLutColor(ceil(x), floor(y), ceil(z)),
          fract(x)
        ),
        mix(
          getLutColor(floor(x), ceil(y), ceil(z)),
          getLutColor(ceil(x), ceil(y), ceil(z)),
          fract(x)
        ),
        fract(y)
      ), 
      fract(z)
    );

    if (color.a == 0.0) {
      return color;
    }
    return float4(lutColor.rgb, color.a);
  }
`);

export const applyLutFilter = (shader: SkShader, lutShader: SkShader) => {
  'worklet';
  if (!ColorLUTEffect) {
    console.warn('Could not compile LUT effect');
    return shader;
  }
  return ColorLUTEffect.makeShaderWithChildren(
    [],
    [shader, lutShader],
    Skia.Matrix(),
  );
};
