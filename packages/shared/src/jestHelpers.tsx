export const waitForPromisesAndFakeTimers = async () => {
  if (isFakeTimersEnabled()) {
    do {
      jest.runAllTimers();
      await flushPromises();
    } while (jest.getTimerCount() > 0);
  } else {
    return new Promise(setImmediate);
  }
};

export const flushPromises = (): Promise<void> =>
  new Promise(jest.requireActual('timers').setImmediate);

export const isFakeTimersEnabled = () => {
  // @ts-expect-error - jest.setTimeout is not defined in the type definition

  const { clock } = setTimeout;
  return (
    typeof jest !== 'undefined' &&
    clock != null &&
    typeof clock.Date === 'function'
  );
};
