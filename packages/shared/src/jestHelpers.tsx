/**
 * Waits for all pending promises and timers to complete.
 * Use this function to wait for all promises and timers to complete before continuing with your test.
 */
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

/**
 * Flushes all pending promises in the Promise queue.
 * Use this function to wait for all promises to resolve before continuing with your test.
 */
export const flushPromises = (): Promise<void> =>
  new Promise(jest.requireActual('timers').setImmediate);

/**
 * Returns true if fake timers are enabled.
 */
export const isFakeTimersEnabled = () => {
  // @ts-expect-error - jest.setTimeout is not defined in the type definition

  const { clock } = setTimeout;
  return (
    typeof jest !== 'undefined' &&
    clock != null &&
    typeof clock.Date === 'function'
  );
};

/**
 * An helper function to mock a React component.
 * @param name The name of the component.
 * @param additionalProps Additional props to pass to the component.
 * @param mockRef A function that returns the ref object of the component (if any).
 */
export const mockReactComponent = (
  name: string,
  additionalProps: any,
  mockRef?: () => any,
) => {
  const react = require('react');
  const Component = (props: any, ref: any) => {
    if (mockRef) {
      react.useImperativeHandle(ref, () => mockRef(), []);
    }
    return react.createElement(name, { ...props, ...additionalProps, ref });
  };
  Component.displayName = name;
  return react.forwardRef(Component);
};
