import { useIntl } from 'react-intl';
import crossZoom from './transitions/crossZoom';
import {
  directionalDown,
  directionalLeft,
  directionalRight,
  directionalUp,
} from './transitions/directional';
import directionalWipe from './transitions/directionalWipe';
import dreamyZoom from './transitions/dreamyZoom';
import fade from './transitions/fade';
import glitchMemories from './transitions/glitchMemories';
import hexagonalize from './transitions/hexagonalize';
import linearBlur from './transitions/linearBlur';
import pixelize from './transitions/pixelize';
import rotateScaleFade from './transitions/rotateScaleFade';
import simpleZoom from './transitions/simpleZoom';
import squaresWire from './transitions/squaresWire';
import wind from './transitions/wind';
import windowBlinds from './transitions/windowBlinds';
import windowsSliceEffect from './transitions/windowSlice';
import wipeDown from './transitions/wipeDown';
import wipeLeft from './transitions/wipeLeft';
import wipeRight from './transitions/wipeRight';
import wipeUp from './transitions/wipeUp';
import type { SkShader, SkCanvas } from '@shopify/react-native-skia';

export type CoverTransition = (args: {
  canvas: SkCanvas;
  inShader: SkShader;
  outShader: SkShader;
  time: number;
  width: number;
  height: number;
}) => void;

const coverTransitions = {
  [directionalWipe.id]: directionalWipe,
  [pixelize.id]: pixelize,
  [directionalUp.id]: directionalUp,
  [directionalDown.id]: directionalDown,
  [directionalLeft.id]: directionalLeft,
  [directionalRight.id]: directionalRight,
  [windowsSliceEffect.id]: windowsSliceEffect,
  [simpleZoom.id]: simpleZoom,
  [rotateScaleFade.id]: rotateScaleFade,
  [crossZoom.id]: crossZoom,
  [dreamyZoom.id]: dreamyZoom,
  [fade.id]: fade,
  [glitchMemories.id]: glitchMemories,
  [linearBlur.id]: linearBlur,
  [squaresWire.id]: squaresWire,
  [windowBlinds.id]: windowBlinds,
  [wipeDown.id]: wipeDown,
  [wipeUp.id]: wipeUp,
  [wipeLeft.id]: wipeLeft,
  [wipeRight.id]: wipeRight,
  [hexagonalize.id]: hexagonalize,
  [wind.id]: wind,
} as const;

export function useCoverTransitionsList(): CoverTransitionsListItem[] {
  const intl = useIntl();

  return [
    //new way
    {
      id: directionalWipe.id,
      label: intl.formatMessage({
        defaultMessage: 'Directional Wipe',
        description: 'Cover Edition Transition - Directional Wipe',
      }),
    },
    {
      id: pixelize.id,
      label: intl.formatMessage({
        defaultMessage: 'Pixelize',
        description: 'Cover Edition Transition - Pixelize',
      }),
    },
    {
      id: directionalUp.id,
      label: intl.formatMessage({
        defaultMessage: 'Directional Up',
        description: 'Cover Edition Transition - Directional Up',
      }),
    },
    {
      id: directionalDown.id,
      label: intl.formatMessage({
        defaultMessage: 'Directional Down',
        description: 'Cover Edition Transition - Directional Down',
      }),
    },
    {
      id: directionalLeft.id,
      label: intl.formatMessage({
        defaultMessage: 'Directional Left',
        description: 'Cover Edition Transition - Directional Left',
      }),
    },
    {
      id: directionalRight.id,
      label: intl.formatMessage({
        defaultMessage: 'Directional Right',
        description: 'Cover Edition Transition - Directional Left',
      }),
    },
    {
      id: windowsSliceEffect.id,
      label: intl.formatMessage({
        defaultMessage: 'Window slice',
        description: 'Cover Edition Transition - Window slice',
      }),
    },
    {
      id: simpleZoom.id,
      label: intl.formatMessage({
        defaultMessage: 'Simple Zoom',
        description: 'Cover Edition Transition - Simple Zoom',
      }),
    },
    {
      id: rotateScaleFade.id,
      label: intl.formatMessage({
        defaultMessage: 'Rotate Scale Fade',
        description: 'Cover Edition Transition - Rotate Scale Fade',
      }),
    },
    {
      id: crossZoom.id,
      label: intl.formatMessage({
        defaultMessage: 'Cross Zoom',
        description: 'Cover Edition Transition - Cross Zoom',
      }),
    },
    {
      id: dreamyZoom.id,
      label: intl.formatMessage({
        defaultMessage: 'Dreamy Zoom',
        description: 'Cover Edition Transition - Dreamy Zoom',
      }),
    },
    {
      id: 'fade',
      label: intl.formatMessage({
        defaultMessage: 'Fade',
        description: 'Cover Edition Transition - Fade',
      }),
    },
    {
      id: glitchMemories.id,
      label: intl.formatMessage({
        defaultMessage: 'Glitch Memories',
        description: 'Cover Edition Transition - Glitch Memories',
      }),
    },
    {
      id: linearBlur.id,
      label: intl.formatMessage({
        defaultMessage: 'Linear Blur',
        description: 'Cover Edition Transition - Linear Blur',
      }),
    },
    {
      id: squaresWire.id,
      label: intl.formatMessage({
        defaultMessage: 'Squares Wire',
        description: 'Cover Edition Transition - Squares Wire',
      }),
    },
    {
      id: windowBlinds.id,
      label: intl.formatMessage({
        defaultMessage: 'Window Blinds',
        description: 'Cover Edition Transition - Window Blinds',
      }),
    },
    {
      id: wipeDown.id,
      label: intl.formatMessage({
        defaultMessage: 'Wipe Down',
        description: 'Cover Edition Transition - Wipe Down',
      }),
    },
    {
      id: wipeUp.id,
      label: intl.formatMessage({
        defaultMessage: 'Wipe Up',
        description: 'Cover Edition Transition - Wipe Up',
      }),
    },
    {
      id: wipeLeft.id,
      label: intl.formatMessage({
        defaultMessage: 'Wipe Left',
        description: 'Cover Edition Transition - Wipe Left',
      }),
    },
    {
      id: wipeRight.id,
      label: intl.formatMessage({
        defaultMessage: 'Wipe Right',
        description: 'Cover Edition Transition - Wipe Right',
      }),
    },
    {
      id: wind.id,
      label: intl.formatMessage({
        defaultMessage: 'Wind',
        description: 'Cover Edition Transition - Wind',
      }),
    },
    {
      id: hexagonalize.id,
      label: intl.formatMessage({
        defaultMessage: 'Hexagonalize',
        description: 'Cover Edition Transition - Hexagonalize',
      }),
    },
  ] as const;
}

export type CoverTransitions = keyof typeof coverTransitions;

export default coverTransitions;

export type CoverTransitionsListItem = {
  label: string;
  id: CoverTransitions;
};
