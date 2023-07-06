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

export const mockReactComponent = (
  name: string,
  additionalProps: any,
  mockRef?: () => any,
) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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
