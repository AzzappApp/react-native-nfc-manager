export const isWebCardKindSubscription = (_kind: string) => {
  // return kind !== 'personal';
  return false;
};

const modulesKindsSubscription = ['parallax'];

export const isModuleKindSubscription = (_kind: string) => {
  return modulesKindsSubscription.includes(_kind);
};

// temporary increase number of free modules
// see: https://github.com/AzzappApp/azzapp/issues/6878
export const MODULE_COUNT_LIMIT_FOR_SUBSCRIPTION = -1;

export const moduleCountRequiresSubscription = (_moduleCount: number) => {
  return (
    MODULE_COUNT_LIMIT_FOR_SUBSCRIPTION > 0 && // limit is disabled
    _moduleCount >= MODULE_COUNT_LIMIT_FOR_SUBSCRIPTION
  );
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

//we don't have a param seat, users, metatdata  in IAP, so we are basing this info on the subscriptionID
export function extractSeatsFromIAPSubscriptionId(id: string) {
  const parts = id.split('.');
  const number = parts.pop();
  if (number) {
    return parseInt(number, 10);
  }
  return 0;
}
