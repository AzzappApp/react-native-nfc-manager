export const isWebCardKindSubscription = (kind: string) => {
  return kind !== 'personal';
};

export const webCardRequiresSubscription = (webCard: {
  webCardKind: string;
  isMultiUser: boolean;
}) => {
  return webCard.isMultiUser || isWebCardKindSubscription(webCard.webCardKind);
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
