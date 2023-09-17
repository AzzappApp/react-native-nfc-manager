export function objectMove(
  object: { [id: string]: number },
  from: number,
  to: number,
) {
  'worklet';
  const newObject = Object.assign({}, object);
  // eslint-disable-next-line guard-for-in
  for (const id in object) {
    if (object[id] === from) {
      newObject[id] = to;
    }

    if (object[id] === to) {
      newObject[id] = from;
    }
  }
  return newObject;
}

export enum ScrollDirection {
  None,
  Up,
  Down,
}
