const linearZoomIn: Keyframe[] = [
  {
    transform: 'scale(1)',
    offset: 0,
  },
  {
    transform: 'scale(1.4)',
    offset: 1,
  },
];

const linearZoomOut: Keyframe[] = [
  {
    transform: 'scale(1.4)',
    offset: 0,
  },
  {
    transform: 'scale(1)',
    offset: 1,
  },
];

const smoothZoomIn: Keyframe[] = [
  {
    transform: 'scale(1)',
    offset: 0,
    easing: 'ease-in',
  },
  {
    transform: 'scale(1.3)',
    offset: 0.1,
    easing: 'linear',
  },
  {
    transform: 'scale(1.4)',
    offset: 1,
  },
];

const smoothZoomOut: Keyframe[] = [
  {
    transform: 'scale(1.4)',
    offset: 0,
    easing: 'ease-in',
  },
  {
    transform: 'scale(1.1)',
    offset: 0.1,
    easing: 'linear',
  },
  {
    transform: 'scale(1)',
    offset: 1,
  },
];

const pop: Keyframe[] = [
  {
    transform: 'scale(1)',
    offset: 0,
    easing: 'ease-in-out',
  },
  {
    transform: 'scale(1.2)',
    offset: 0.1,
  },
  {
    transform: 'scale(1)',
    offset: 1,
  },
];

const rotate: Keyframe[] = [
  {
    transform: 'rotate(90deg)',
    scale: 2,
    offset: 0,
    easing: 'ease-in-out',
  },
  {
    scale: 1.8,
    offset: 0.07,
  },
  {
    scale: 1.6,
    offset: 0.08,
  },
  {
    transform: 'rotate(0deg)',
    offset: 0.1,
    scale: 1.1,
  },
  {
    scale: 1,
    offset: 1,
  },
];

const appearZoomIn: Keyframe[] = [
  {
    transform: 'scale(1)',
    offset: 0,
    easing: 'ease-in-out',
  },
  {
    transform: 'scale(1.4)',
    offset: 0.1,
  },
];

const appearZoomOut: Keyframe[] = [
  {
    transform: 'scale(1.4)',
    offset: 0,
    easing: 'ease-in-out',
  },
  {
    transform: 'scale(1)',
    offset: 0.1,
  },
];

const fadeInOut: Keyframe[] = [
  {
    opacity: 0,
    offset: 0,
    scale: 1.2,
    easing: 'ease-out',
  },
  {
    opacity: 1,
    offset: 0.5,
    scale: 1,
    easing: 'linear',
  },
  {
    opacity: 0,
    offset: 1,
    scale: 1.2,
    easing: 'ease-in',
  },
];

export const animations = {
  linearZoomIn,
  linearZoomOut,
  smoothZoomIn,
  smoothZoomOut,
  pop,
  rotate,
  appearZoomIn,
  appearZoomOut,
  fadeInOut,
};
