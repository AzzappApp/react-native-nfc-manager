import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export type CoverOverlayEffectProps = {
  overlayEffect: string;
  color: string;
  width: number | string;
  height: number | string;
  testID?: string;
};

const SVGMAP: Record<string, React.ComponentType<SvgProps>> = {
  darken: (props: SvgProps) => (
    <Svg {...props} viewBox="0 0 125 200">
      <Path d="M0 0h125v200H0V0Z" fill="currentColor" opacity={0.4} />
    </Svg>
  ),
  'diagonal-left': (props: SvgProps) => (
    <Svg {...props} viewBox="0 0 125 200">
      <Path d="M125 178.83 0 149v51h125v-21.17Z" fill="currentColor" />
    </Svg>
  ),
  'diagonal-right': (props: SvgProps) => (
    <Svg {...props} viewBox="0 0 125 200">
      <Path d="M0 179.245 125 150v50H0v-20.755Z" fill="currentColor" />
    </Svg>
  ),
  'gradient-bottom-top': (props: SvgProps) => (
    <Svg {...props} viewBox="0 0 125 200">
      <Path d="M0 0h125v200H0V0Z" fill="url(#a)" />
      <Defs>
        {/*@ts-expect-error type seems incorrect */}
        <LinearGradient
          id="a"
          x1="62.5"
          y1="-5.128"
          x2="62.5"
          y2="210.256"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={props.color} />
          <Stop offset={0.24} stopOpacity="0" />
          <Stop offset={0.703} stopOpacity="0" />
          <Stop offset={0.919} stopColor={props.color} stopOpacity="1" />
        </LinearGradient>
      </Defs>
    </Svg>
  ),
  'gradient-bottom': (props: SvgProps) => (
    <Svg {...props} viewBox="0 0 125 200">
      <Path d="M0 0h125v200H0V0Z" fill="url(#a)" />
      <Defs>
        {/*@ts-expect-error type seems incorrect */}
        <LinearGradient
          id="a"
          x1="62.5"
          y1="-5.128"
          x2="62.5"
          y2="210.256"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0.732} stopOpacity="0" />
          <Stop offset={0.919} stopColor={props.color} />
        </LinearGradient>
      </Defs>
    </Svg>
  ),
  intersect: (props: SvgProps) => (
    <Svg {...props} viewBox="0 0 125 200">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 149.091V200h125v-80h-10.417v21.818h-10.416v-14.545H93.75v69.091H83.333v-25.455H72.917v18.182H62.5v-47.273H52.083V200v-21.818H41.667v-29.091H31.25V200v-36.364H20.833v25.455H10.417V200v-50.909H0Z"
        fill="currentColor"
      />
    </Svg>
  ),
  'intersect-round': (props: SvgProps) => (
    <Svg {...props} viewBox="0 0 125 200">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 154.299V200h125v-74.792a5.208 5.208 0 0 0-10.417 0v11.402a5.208 5.208 0 0 1-10.416 0v-4.129a5.209 5.209 0 0 0-10.417 0v58.674a5.209 5.209 0 1 1-10.417 0v-15.038a5.208 5.208 0 0 0-10.416 0v7.766a5.208 5.208 0 0 1-10.417 0v-36.856a5.209 5.209 0 1 0-10.417 0v25.946a5.209 5.209 0 1 1-10.416 0v-18.674a5.208 5.208 0 0 0-10.417 0v4.129a5.208 5.208 0 0 1-5.208 5.208 5.209 5.209 0 0 0-5.209 5.209v15.038a5.208 5.208 0 0 1-10.416 0v-29.584a5.208 5.208 0 0 0-10.417 0Z"
        fill="currentColor"
      />
    </Svg>
  ),
  substract: (props: SvgProps) => (
    <Svg {...props} viewBox="0 0 125 200">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 122.955V200h125v-77.045c0 34.517-27.982 62.5-62.5 62.5S0 157.472 0 122.955Z"
        fill="currentColor"
      />
    </Svg>
  ),
  wave: (props: SvgProps) => (
    <Svg {...props} viewBox="0 0 125 200">
      <Path
        d="M0 149.091s20.833 38.182 61.198 0 63.802 0 63.802 0V200H0v-50.909Z"
        fill="currentColor"
      />
    </Svg>
  ),
};

const CoverOverlayEffect = ({
  overlayEffect,
  color,
  width,
  height,
  testID,
}: CoverOverlayEffectProps) => {
  const Comp = SVGMAP[overlayEffect];

  if (Comp) {
    return <Comp color={color} width={width} height={height} testID={testID} />;
  }
  return null;
};

export default CoverOverlayEffect;
