import * as Device from 'expo-device';

export const MEMORY_SIZE = (Device.totalMemory ?? 0) / Math.pow(1024, 3);
