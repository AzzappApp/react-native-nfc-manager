import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export type EffectProps = {
  color: string;
  width: number | string;
  height: number | string;
  nativeID?: string;
};

const CoverOverlayEffects = ({
  overlayEffect,
  ...props
}: EffectProps & { overlayEffect: string }) => {
  switch (overlayEffect) {
    case 'darken':
      return <Darken {...props} />;
    case 'diagonal-left':
      return <DiagonalLeft {...props} />;
    case 'diagonal-right':
      return <DiagonalRight {...props} />;
    case 'gradient-bottom-top':
      return <GradientBottomTop {...props} />;
    case 'gradient-bottom':
      return <GradientBottom {...props} />;
    case 'intersect-round':
      return <IntersectRound {...props} />;
    case 'intersect':
      return <Intersect {...props} />;
    case 'substract':
      return <Substract {...props} />;
    case 'wave':
      return <Wave {...props} />;
    default:
      return null;
  }
};

export default CoverOverlayEffects;

export const Darken = ({ color, width, height, nativeID }: EffectProps) => (
  <Svg
    height={height}
    width={width}
    preserveAspectRatio="xMaxYMax"
    nativeID={nativeID}
    viewBox="0 0 48 55"
  >
    <Path
      d="M0 9C0 4.02944 4.02944 0 9 0H39C43.9706 0 48 4.02944 48 9V46C48 50.9706 43.9706 55 39 55H9C4.02944 55 0 50.9706 0 46V9Z"
      fill={color}
      fillOpacity="0.1"
    />
  </Svg>
);

export const DiagonalLeft = ({
  color,
  width,
  height,
  nativeID,
}: EffectProps) => (
  <Svg
    height={height}
    width={width}
    preserveAspectRatio="xMaxYMax"
    nativeID={nativeID}
    viewBox="0 0 275 110"
  >
    <Path d="M275 85L0 0V110H275V85Z" fill={color} fillOpacity="1" />
  </Svg>
);

export const DiagonalRight = ({
  color,
  width,
  height,
  nativeID,
}: EffectProps) => (
  <Svg
    height={height}
    width={width}
    preserveAspectRatio="xMaxYMax"
    nativeID={nativeID}
    viewBox="0 0 275 110"
  >
    <Path d="M0 85L275 0V110H0V85Z" fill={color} fillOpacity="1" />
  </Svg>
);

export const GradientBottomTop = ({
  color,
  width,
  height,
  nativeID,
}: EffectProps) => (
  <Svg
    height={height}
    width={width}
    preserveAspectRatio="xMaxYMax"
    nativeID={nativeID}
    viewBox="0 0 48 55"
  >
    <Path
      d="M0 9C0 4.02944 4.02944 0 9 0H39C43.9706 0 48 4.02944 48 9V46C48 50.9706 43.9706 55 39 55H9C4.02944 55 0 50.9706 0 46V9Z"
      fill="url(#gradientBottomTopGradient)"
    />
    <Defs>
      {/* @ts-expect-error seems LinearGradient definition is wrong */}
      <LinearGradient
        id="gradientBottomTopGradient"
        x1="24"
        y1="-1.41026"
        x2="24"
        y2="57.8205"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor={color} stopOpacity="1" />
        <Stop offset="0.239583" stopColor={color} stopOpacity="0.1" />
        <Stop offset="0.703125" stopColor={color} stopOpacity="0.1" />
        <Stop offset="0.918615" stopColor={color} stopOpacity="1" />
      </LinearGradient>
    </Defs>
  </Svg>
);

export const GradientBottom = ({
  color,
  width,
  height,
  nativeID,
}: EffectProps) => (
  <Svg
    height={height}
    width={width}
    preserveAspectRatio="xMaxYMax"
    nativeID={nativeID}
    viewBox="0 0 48 55"
  >
    <Path
      d="M0 9C0 4.02944 4.02944 0 9 0H39C43.9706 0 48 4.02944 48 9V46C48 50.9706 43.9706 55 39 55H9C4.02944 55 0 50.9706 0 46V9Z"
      fill="url(#gradientBottomGradient)"
    />
    <Defs>
      {/* @ts-expect-error seems LinearGradient definition is wrong */}
      <LinearGradient
        id="gradientBottomGradient"
        x1="24"
        y1="-1.41026"
        x2="24"
        y2="57.8205"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0.572511" stopColor={color} stopOpacity="0.1" />
        <Stop offset="0.918615" stopColor={color} stopOpacity="1" />
      </LinearGradient>
    </Defs>
  </Svg>
);

export const IntersectRound = ({
  color,
  width,
  height,
  nativeID,
}: EffectProps) => (
  <Svg
    height={height}
    width={width}
    preserveAspectRatio="xMaxYMax"
    nativeID={nativeID}
    viewBox="0 0 275 176"
  >
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 56.8335V167.042C0 172.012 4.02945 176.042 9.00001 176.042H45.8332V119.854C45.8332 113.779 40.9083 108.854 34.8332 108.854H33.9167C27.8415 108.854 22.9167 103.929 22.9167 97.854V56.8335C22.9167 50.7584 17.9918 45.8335 11.9167 45.8335H11C4.92487 45.8335 0 50.7584 0 56.8335ZM114.583 176.042H45.8335V79.75C45.8335 73.6749 50.7584 68.75 56.8335 68.75H57.75C63.8251 68.75 68.75 63.8251 68.75 57.75V56.8335C68.75 50.7584 73.6749 45.8335 79.75 45.8335H80.6667C86.7418 45.8335 91.6667 50.7584 91.6667 56.8335V80.6665C91.6667 86.7416 96.5915 91.6665 102.667 91.6665H103.583C109.658 91.6665 114.583 96.5914 114.583 102.667V176.042ZM183.333 176.042H114.583V45.375C114.583 39.2999 119.508 34.375 125.583 34.375H126.5C132.575 34.375 137.5 39.2999 137.5 45.375V97.854C137.5 103.929 142.425 108.854 148.5 108.854H149.417C155.492 108.854 160.417 103.929 160.417 97.854V91.2085C160.417 85.1334 165.341 80.2085 171.417 80.2085H172.333C178.408 80.2085 183.333 85.1334 183.333 91.2085V176.042ZM252.083 176.042H183.333V131.312C183.333 125.237 188.258 120.312 194.333 120.312H195.25C201.325 120.312 206.25 115.388 206.25 109.312V22.4585C206.25 16.3834 211.175 11.4585 217.25 11.4585H218.167C224.242 11.4585 229.167 16.3834 229.167 22.4585V23.375C229.167 29.4501 234.092 34.375 240.167 34.375H241.083C247.158 34.375 252.083 39.2999 252.083 45.375V176.042ZM275 10.9414V167.042C275 172.012 270.971 176.042 266 176.042H252.083V11C252.083 4.92488 257.008 0 263.083 0H264C270.056 0 274.968 4.89325 275 10.9414Z"
      fill={color}
      fillOpacity="1"
    />
  </Svg>
);

export const Intersect = ({ color, width, height, nativeID }: EffectProps) => (
  <Svg
    height={height}
    width={width}
    preserveAspectRatio="xMaxYMax"
    nativeID={nativeID}
    viewBox="0 0 48 22"
  >
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 8V13C0 17.9706 4.02944 22 9 22H39C43.9706 22 48 17.9706 48 13V0H44V6H40V2H36V21H32V14H28V19H24V6H20V16H16V8H12V12H8V19H4V8H0Z"
      fill={color}
      fillOpacity="1"
    />
  </Svg>
);

export const Substract = ({ color, width, height, nativeID }: EffectProps) => (
  <Svg
    height={height}
    width={width}
    preserveAspectRatio="xMaxYMax"
    nativeID={nativeID}
    viewBox="0 0 48 28"
  >
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 0V19C0 23.9706 4.02944 28 9 28H39C43.9706 28 48 23.9706 48 19V0C48 13.2548 37.2548 24 24 24C10.7452 24 0 13.2548 0 0Z"
      fill={color}
      fillOpacity="1"
    />
  </Svg>
);

export const Wave = ({ color, width, height, nativeID }: EffectProps) => (
  <Svg
    height={height}
    width={width}
    preserveAspectRatio="xMaxYMax"
    nativeID={nativeID}
    viewBox="0 0 48 19"
  >
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 5.00016C0 5.00016 8 15.5002 23.5 5.00016C39 -5.49984 48 5.00016 48 5.00016V10.0002C48 14.9707 43.9706 19.0002 39 19.0002H9C4.02944 19.0002 0 14.9707 0 10.0002V5.00016Z"
      fill={color}
      fillOpacity="1"
    />
  </Svg>
);
