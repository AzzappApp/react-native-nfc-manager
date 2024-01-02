import { DESKTOP_WIDTH } from '#helpers/devices';

const fadeIn: Keyframe[] = [
  { opacity: 0, offset: 0, easing: 'ease-in-out' },
  { opacity: 1, offset: 0.2 },
  { opacity: 1, offset: 0.8 },
  { opacity: 0, offset: 1 },
];

const appear: Keyframe[] = [
  { opacity: 0, offset: 0 },
  { opacity: 1, offset: 0.2 },
];

const fadeInByLetter = (letterAnimPosition: number): Keyframe[] => [
  { opacity: 0, offset: 0, easing: 'ease-in-out' },
  { opacity: 0, offset: letterAnimPosition * 0.2 },
  { opacity: 1, offset: letterAnimPosition * 0.8 },
  { opacity: 1, offset: 1 },
];

const appearByLetter = (letterAnimPosition: number): Keyframe[] => [
  { opacity: 0, offset: 0 },
  { opacity: 1, offset: 0.2 + letterAnimPosition * 0.2 },
];

const bounce: Keyframe[] = [
  {
    opacity: 0,
    scale: 0.5,
    offset: 0,
  },
  {
    opacity: 0,
    scale: 0.5,
    offset: 0.1,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  {
    opacity: 1,
    scale: 1,
    offset: 0.3,
  },
  {
    opacity: 1,
    scale: 1,
    offset: 0.8,
  },
  {
    opacity: 0.1,
    scale: 0.5,
    offset: 1,
  },
];

const neon: Keyframe[] = [
  { opacity: 0, offset: 0 },
  { opacity: 1, offset: 0.2 },
  { opacity: 0, offset: 0.225 },
  { opacity: 1, offset: 0.25 },
  { opacity: 0, offset: 0.275 },
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

const slideBottom: Keyframe[] = slideBuilder(true, true);
const slideTop: Keyframe[] = slideBuilder(true, false);
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
    transform: `${slideDirection(vertical)}(${slide(!minus)})`,
    offset: 1,
    easing: 'ease-in-out',
    opacity: 0,
  },
];

const smoothBottom: Keyframe[] = smoothBuilder(true, true);
const smoothTop: Keyframe[] = smoothBuilder(true, false);
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

const slideLettersBottom = slideLettersBuilder(true, true);
const slideLettersTop = slideLettersBuilder(true, false);
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
      offset: 0.96 - (1 - letterAnimPosition) * 0.2,
      easing: 'ease-in-out',
    },
    {
      opacity: 0,
      offset: 1,
    },
  ];

const smoothLettersBottom = smoothLettersBuilder(true, true);
const smoothLettersTop = smoothLettersBuilder(true, false);
const smoothLettersLeft = smoothLettersBuilder(false, true);
const smoothLettersRight = smoothLettersBuilder(false, false);

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
  slideTop,
  slideLettersLeft,
  slideLettersRight,
  slideLettersBottom,
  slideLettersTop,
  smoothLeft,
  smoothRight,
  smoothBottom,
  smoothTop,
  smoothLettersLeft,
  smoothLettersRight,
  smoothLettersBottom,
  smoothLettersTop,
};
