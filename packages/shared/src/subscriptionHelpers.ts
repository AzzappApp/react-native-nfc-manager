export const isWebCardKindSubscription = (kind: string) => {
  return kind !== 'personal';
};
const modulesKindsSubscription = ['simpleButton', 'parallax'];

export const isModuleKindSubscription = (kind: string) => {
  return modulesKindsSubscription.includes(kind);
};

export const moduleCountRequiresSubscription = (moduleCount: number) => {
  return moduleCount > 3;
};

export const webcardRequiresSubscription = (
  modules: ReadonlyArray<{ readonly kind: string }>,
  kind?: string | null,
) => {
  // return false; //TODO: CHANGE THIS. (did it here to not block the dev test in merge)
  if (kind && isWebCardKindSubscription(kind)) return true;
  return (
    moduleCountRequiresSubscription(modules.length) ||
    modules.some(module => isModuleKindSubscription(module.kind))
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
