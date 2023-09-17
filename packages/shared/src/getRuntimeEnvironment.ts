/**
 * An utility function that allows to retrieve the current runtime environment,
 * `node`, `react-native` or `web`.
 *
 * @returns the current runtime environment
 */
const getRuntimeEnvironment = (): 'node' | 'react-native' | 'web' => {
  if (typeof document !== 'undefined') {
    return 'web';
  } else if (
    typeof navigator !== 'undefined' &&
    navigator.product === 'ReactNative'
  ) {
    return 'react-native';
  } else {
    return 'node';
  }
};

export default getRuntimeEnvironment;
