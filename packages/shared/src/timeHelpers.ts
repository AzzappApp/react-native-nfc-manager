const minute = 60;
const hour = minute * 60;
const day = hour * 24;

/**
 * A helper function to get the elapsed time since a given timestamp.
 * @param sinceTimestamp The timestamp to compare against.
 * @returns An object with the elapsed time and the unit of time.
 */
export const getElapsedTime = (sinceTimestamp: number) => {
  const elapsed = (Date.now() - sinceTimestamp) / 1000;

  if (elapsed > day) return { kind: 'day', value: Math.floor(elapsed / day) };
  if (elapsed > hour)
    return { kind: 'hour', value: Math.floor(elapsed / hour) };
  if (elapsed > minute)
    return { kind: 'minute', value: Math.floor(elapsed / minute) };
  return { kind: 'second', value: elapsed };
};
