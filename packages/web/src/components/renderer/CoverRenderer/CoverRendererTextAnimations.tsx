import { DESKTOP_WIDTH } from '#helpers/devices';

const fadeIn: Keyframe[] = [
  { opacity: 0, offset: 0, easing: 'ease-in-out' },
  { opacity: 0.5, offset: 0.1 },
  { opacity: 1, offset: 0.2 },
  { opacity: 1, offset: 0.8 },
  { opacity: 0, offset: 1 },
];

const appear: Keyframe[] = [
  { visibility: 'hidden', offset: 0 },
  { visibility: 'hidden', offset: 0.1 },
  { visibility: 'visible', offset: 0.2 },
];

const fadeInByLetter = (letterAnimPosition: number): Keyframe[] => [
  { opacity: 0, offset: 0, easing: 'ease-in-out' },
  { opacity: 0.5, offset: letterAnimPosition * 0.2 },
  { opacity: 1, offset: letterAnimPosition * 0.8 },
  { opacity: 1, offset: 1 },
];

const appearByLetter = (letterAnimPosition: number): Keyframe[] => [
  { visibility: 'hidden', offset: 0 },
  { visibility: 'hidden', offset: letterAnimPosition * 0.2 },
  { visibility: 'visible', offset: letterAnimPosition * 0.2 + 0.2 },
  { visibility: 'visible', offset: 1 },
];

const bounce: Keyframe[] = [
  {
    opacity: 0,
    scale: 0.2,
    offset: 0,
    easing: 'ease-in-out',
  },
  {
    opacity: 1,
    scale: 1,
    offset: 0.2,
  },
  {
    opacity: 1,
    scale: 0.92,
    offset: 0.25,
  },
  {
    opacity: 1,
    scale: 1,
    offset: 0.3,
  },
  {
    opacity: 1,
    scale: 0.96,
    offset: 0.325,
  },
  {
    opacity: 1,
    scale: 0.96,
    offset: 0.35,
  },
  {
    opacity: 1,
    scale: 1,
    offset: 0.8,
  },
  {
    opacity: 0.1,
    scale: 0.3,
    offset: 0.95,
  },
  {
    opacity: 0.2,
    scale: 0.5,
    offset: 0.97,
  },
  {
    opacity: 0.05,
    scale: 0.3,
    offset: 0.98,
  },
  {
    opacity: 0,
    scale: 0.2,
    offset: 1,
  },
];

const neon: Keyframe[] = [
  { opacity: 0, offset: 0 },
  { opacity: 0, offset: 0.199 },
  { opacity: 1, offset: 0.2 },
  { opacity: 1, offset: 0.224 },
  { opacity: 0, offset: 0.225 },
  { opacity: 0, offset: 0.249 },
  { opacity: 1, offset: 0.25 },
  { opacity: 1, offset: 0.274 },
  { opacity: 0, offset: 0.275 },
  { opacity: 0, offset: 0.299 },
  { opacity: 1, offset: 0.3 },
  { opacity: 1, offset: 1 },
];

// FIXME: 4em is a hack to make the animation on each letter work on desktop (it avoids to calculate parent container size)
const slide = (minus: boolean, letters?: boolean) =>
  typeof window != 'undefined' && window?.innerWidth >= DESKTOP_WIDTH
    ? `calc((${letters ? '4em' : '100%'} + 18.75px) * ${minus ? '-1' : '1'} )`
    : `calc((${letters ? '4em' : '100%'} + 5vw) * ${minus ? '-1' : '1'} )`;

const slideDirection = (vertical: boolean) =>
  vertical ? 'translateY' : 'translateX';

const slideBuilder = (vertical: boolean, minus: boolean) => [
  {
    transform: `${slideDirection(vertical)}(${slide(minus)})`,
    offset: 0,
  },
  {
    transform: 'translate(0)',
    offset: 0.1,
    easing: 'ease-in-out',
  },
  {
    transform: 'translate(0)',
    offset: 0.96,
  },
  {
    transform: `${slideDirection(vertical)}(${slide(!minus)})`,
    offset: 1,
    easing: 'ease-in-out',
  },
];

const slideBottom: Keyframe[] = slideBuilder(true, false);
const slideUp: Keyframe[] = slideBuilder(true, true);
const slideLeft: Keyframe[] = slideBuilder(false, true);
const slideRight: Keyframe[] = slideBuilder(false, false);

const smoothBuilder = (vertical: boolean, minus: boolean) => [
  {
    transform: `${slideDirection(vertical)}(${slide(minus)})`,
    offset: 0,
    opacity: 0,
  },
  {
    transform: 'translate(0)',
    offset: 0.2,
    easing: 'ease-in-out',
    opacity: 1,
  },
  {
    transform: 'translate(0)',
    offset: 0.8,
    opacity: 1,
  },
  {
    offset: 1,
    easing: 'ease-in-out',
    opacity: 0,
  },
];

const smoothBottom: Keyframe[] = smoothBuilder(true, false);
const smoothUp: Keyframe[] = smoothBuilder(true, true);
const smoothLeft: Keyframe[] = smoothBuilder(false, true);
const smoothRight: Keyframe[] = smoothBuilder(false, false);

const slideLettersBuilder =
  (vertical: boolean, minus: boolean) =>
  (letterAnimPosition: number): Keyframe[] => [
    {
      transform: `${slideDirection(vertical)}(${slide(minus, true)})`,
      offset: 0,
      opacity: 0,
      easing: 'ease-in-out',
    },
    {
      transform: `${slideDirection(vertical)}(${slide(minus, true)})`,
      offset: 0.1,
      opacity: 0,
    },
    {
      transform: 'translate(0)',
      offset: 0.1 + letterAnimPosition * 0.2,
      opacity: 1,
    },
  ];

const slideLettersBottom = slideLettersBuilder(true, false);
const slideLettersUp = slideLettersBuilder(true, true);
const slideLettersLeft = slideLettersBuilder(false, true);
const slideLettersRight = slideLettersBuilder(false, false);

const smoothLettersBuilder =
  (vertical: boolean, minus: boolean) =>
  (letterAnimPosition: number): Keyframe[] => [
    {
      transform: `${slideDirection(vertical)}(${slide(minus, true)})`,
      offset: 0,
      opacity: 0,
      easing: 'ease-in-out',
    },
    {
      transform: 'translate(0)',
      offset: letterAnimPosition * 0.2,
      opacity: 1,
    },
    {
      transform: 'translate(0)',
      offset: 0.92 - (1 - letterAnimPosition) * 0.2,
      opacity: 1,
    },
    {
      opacity: 0,
      offset: 0.98 - (1 - letterAnimPosition) * 0.01,
      easing: 'ease-in-out',
    },
    {
      opacity: 0,
      offset: 1,
    },
  ];

const smoothLettersBottom = smoothLettersBuilder(true, false);
const smoothLettersUp = smoothLettersBuilder(true, true);

export const textAnimations = {
  fadeIn,
  fadeInByLetter,
  appear,
  appearByLetter,
  bounce,
  neon,
  slideLeft,
  slideRight,
  slideBottom,
  slideUp,
  slideLettersLeft,
  slideLettersRight,
  slideLettersBottom,
  slideLettersUp,
  smoothLeft,
  smoothRight,
  smoothBottom,
  smoothUp,
  smoothLettersBottom,
  smoothLettersUp,
};
