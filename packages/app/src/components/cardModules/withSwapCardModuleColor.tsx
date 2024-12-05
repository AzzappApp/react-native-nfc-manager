import React, { useMemo } from 'react';
import {
  swapModuleColor,
  type CardModuleColor,
} from '@azzapp/shared/cardModuleHelpers';
import type { ModuleKindHasVariants } from '#helpers/webcardModuleHelpers';
import type { CommonModuleRendererProps } from './cardModuleEditorType';

type WithSwappedColorsProps<
  T,
  V extends ModuleKindHasVariants,
> = CommonModuleRendererProps<T, V>;
const withSwapCardModuleColor = <
  T extends { cardModuleColor: CardModuleColor },
  V extends ModuleKindHasVariants,
>(
  WrappedComponent: React.ComponentType<WithSwappedColorsProps<T, V>>,
) => {
  const WithSwappedColors = (props: WithSwappedColorsProps<T, V>) => {
    const { data, colorPalette } = props;
    const swappedColor = useMemo(
      () => swapModuleColor(data.cardModuleColor, colorPalette),
      [colorPalette, data.cardModuleColor],
    );

    return (
      <WrappedComponent
        {...props}
        data={{ ...data, cardModuleColor: swappedColor }}
      />
    );
  };

  WithSwappedColors.displayName = `WithSwappedColors(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithSwappedColors;
};

export default withSwapCardModuleColor;
