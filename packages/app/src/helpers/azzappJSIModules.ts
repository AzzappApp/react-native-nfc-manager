import { NativeModules } from 'react-native';

const AZPJSIModulesInstaller = NativeModules.AZPJSIModulesInstaller;

AZPJSIModulesInstaller?.install();

export const getJSIModule = (moduleName: string) => {
  const AZPJSIModules = (global as any).AZPJSIModules;
  if (!AZPJSIModules) {
    throw new Error('AZPJSIModules not found');
  }
  const module = AZPJSIModules[moduleName];
  if (!module) {
    throw new Error(`Module ${moduleName} not found`);
  }
  return module;
};
