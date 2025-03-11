import type { MutableRefObject } from 'react';

export type ScrollableToOffset = MutableRefObject<{
  scrollToOffset: (arg: { offset: number; animated: boolean }) => void;
} | null>;
