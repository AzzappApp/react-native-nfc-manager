export type MediaKind = 'mixed' | 'picture' | 'video';

export type MediaInfo = {
  kind: Exclude<MediaKind, 'mixed'>;
  assetUri: string;
  uri: string;
  playableDuration: number;
  width: number;
  height: number;
};

export type TimeRange = {
  startTime: number;
  duration: number;
};

export const formatVideoTime = (timeInSeconds = 0) => {
  const seconds = Math.floor(timeInSeconds);
  let minutes = Math.floor(timeInSeconds / 60);
  const hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  if (hours) {
    return `${display2digit(hours)}:${display2digit(minutes)}:${display2digit(
      seconds,
    )}`;
  }
  return `${display2digit(minutes)}:${display2digit(seconds)}`;
};

export const display2digit = (n: number) => (n >= 10 ? `${n}` : `0${n}`);
