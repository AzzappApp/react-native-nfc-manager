import React from 'react';
import type { SVGProps } from 'react';

export type CoverOverlayEffectProps = {
  overlayEffect: string;
  color: string;
  width: number | string;
  height: number | string;
  nativeID?: string;
};

const SVGMAP: Record<
  string,
  { default: React.ComponentType<SVGProps<SVGElement>> }
> = {
  darken: require('./assets/overlays/darken.svg'),
  'diagonal-left': require('./assets/overlays/diagonal-left.svg'),
  'diagonal-right': require('./assets/overlays/diagonal-right.svg'),
  'gradient-bottom-top': require('./assets/overlays/gradient-bottom-top.svg'),
  'gradient-bottom': require('./assets/overlays/gradient-bottom.svg'),
  intersect: require('./assets/overlays/intersect.svg'),
  'intersect-round': require('./assets/overlays/intersect-round.svg'),
  substract: require('./assets/overlays/substract.svg'),
  wave: require('./assets/overlays/wave.svg'),
};

const CoverOverlayEffect = ({
  overlayEffect,
  color,
  width,
  height,
  nativeID,
}: CoverOverlayEffectProps) => {
  const Comp = SVGMAP[overlayEffect]?.default;

  if (Comp) {
    return <Comp style={{ width, height, color }} id={nativeID} />;
  }
  return null;
};

export default CoverOverlayEffect;
