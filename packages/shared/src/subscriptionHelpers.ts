export const isWebCardKindSubscription = (kind: string) => {
  return kind !== 'personal';
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const modulesKindsSubscription = ['simpleButton', 'parallax'];

export const isModuleKindSubscription = (_kind: string) => {
  return modulesKindsSubscription.includes(_kind);
};

export const moduleCountRequiresSubscription = (_moduleCount: number) => {
  return _moduleCount > 3;
};

export const webCardRequiresSubscription = (
  _modules: ReadonlyArray<{ readonly kind: string }>,
  _kind?: string | null,
) => {
  if (_kind && isWebCardKindSubscription(_kind)) return true;
  return (
    moduleCountRequiresSubscription(_modules.length) ||
    _modules.some(module => isModuleKindSubscription(module.kind))
  );
};

export const addingModuleRequireSubscription = (
  kind: string,
  currentModuleCount: number,
) => {
  return (
    isModuleKindSubscription(kind) ||
    moduleCountRequiresSubscription(currentModuleCount + 1)
  );
};
