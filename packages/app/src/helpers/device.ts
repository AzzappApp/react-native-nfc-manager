import { getTotalMemorySync } from 'react-native-device-info';

export const MEMORY_SIZE = (getTotalMemorySync() ?? 0) / Math.pow(1024, 3);
