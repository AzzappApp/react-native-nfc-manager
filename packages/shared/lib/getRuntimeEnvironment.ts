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
