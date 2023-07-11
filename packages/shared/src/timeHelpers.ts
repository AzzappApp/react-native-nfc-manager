const minute = 60;
const hour = minute * 60;
const day = hour * 24;

export const getElapsedTime = (sinceTimestamp: number) => {
  const elapsed = (Date.now() - sinceTimestamp) / 1000;

  if (elapsed > day) return { kind: 'day', value: Math.floor(elapsed / day) };
  if (elapsed > hour)
    return { kind: 'hour', value: Math.floor(elapsed / hour) };
  if (elapsed > minute)
    return { kind: 'minute', value: Math.floor(elapsed / minute) };
  return { kind: 'second', value: elapsed };
};
