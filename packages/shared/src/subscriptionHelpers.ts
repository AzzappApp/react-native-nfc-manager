export const isWebCardKindSubscription = (kind: string) => {
  return kind !== 'personal';
};

const modulesKindsSubscription = ['parallax'];

export const isModuleKindSubscription = (_kind: string) => {
  return modulesKindsSubscription.includes(_kind);
};

export const MODULE_COUNT_LIMIT_FOR_SUBSCRIPTION = 4;

export const moduleCountRequiresSubscription = (_moduleCount: number) => {
  return _moduleCount >= MODULE_COUNT_LIMIT_FOR_SUBSCRIPTION;
};

export const hasModuleKindSubscription = (
  _modules: ReadonlyArray<{ readonly kind: string }>,
) => {
  return _modules.some(module => isModuleKindSubscription(module.kind));
};

export const webCardRequiresSubscription = (
  _modules: ReadonlyArray<{ readonly kind: string }>,
  _webCard: {
    webCardKind: string;
    isMultiUser: boolean;
  },
) => {
  return (
    _webCard.isMultiUser ||
    moduleCountRequiresSubscription(_modules.length) ||
    _modules.some(module => isModuleKindSubscription(module.kind))
  );
};

export const changeModuleRequireSubscription = (
  kind: string,
  currentModuleCount: number,
) => {
  return (
    isModuleKindSubscription(kind) ||
    moduleCountRequiresSubscription(currentModuleCount)
  );
};
