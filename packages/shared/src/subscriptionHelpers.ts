export const isWebCardKindSubscription = (kind: string) => {
  return kind !== 'personal';
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  if (
    _webCard.isMultiUser ||
    (_webCard.webCardKind && isWebCardKindSubscription(_webCard.webCardKind))
  )
    return true;
  return (
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
