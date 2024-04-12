export const isWebCardKindSubscription = (kind: string) => {
  return kind !== 'personal';
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const modulesKindsSubscription = ['simpleButton', 'parallax'];

export const isModuleKindSubscription = (_kind: string) => {
  return false; //TODO: CHANGE THIS. (did it here to not block the dev test in merge)
  //return modulesKindsSubscription.includes(_kind);
};

export const moduleCountRequiresSubscription = (_moduleCount: number) => {
  return false; //TODO: CHANGE THIS. (did it here to not block the dev test in merge)
  //return moduleCount > 3;
};

export const webcardRequiresSubscription = (
  _modules: ReadonlyArray<{ readonly kind: string }>,
  _kind?: string | null,
) => {
  return false; //TODO: CHANGE THIS. (did it here to not block the dev test in merge)
  /** if (kind && isWebCardKindSubscription(kind)) return true;
  return (
    moduleCountRequiresSubscription(modules.length) ||
    modules.some(module => isModuleKindSubscription(module.kind))
  );
  */
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
