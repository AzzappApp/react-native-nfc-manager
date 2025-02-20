import { Platform } from 'react-native';

// was added to disable multi user feature
export const ENABLE_MULTI_USER = Platform.OS === 'ios';
