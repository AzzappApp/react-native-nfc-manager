import { TurboModuleRegistry } from 'react-native';
import type { TurboModule } from 'react-native';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface Spec extends TurboModule {
  install(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AzzappRNBufferLoader');
