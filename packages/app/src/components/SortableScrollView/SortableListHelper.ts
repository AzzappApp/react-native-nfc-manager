export function objectMove(
  object: { [id: string]: number },
  from: number,
  to: number,
) {
  'worklet';
  const newObject = Object.assign({}, object);
  // when we move an object from index 'from' to index 'to',
  // we need to update the position of the other object between them and not only the one it si replacing

  const direction = from < to ? 'up' : 'down';

  // eslint-disable-next-line guard-for-in
  for (const id in object) {
    if (object[id] === from) {
      newObject[id] = to;
    }
    if (direction === 'up' && object[id] > from && object[id] <= to) {
      newObject[id] = object[id] - 1;
    }
    if (direction === 'down' && object[id] < from && object[id] >= to) {
      newObject[id] = object[id] + 1;
    }
  }
  return newObject;
}

export enum ScrollDirection {
  None,
  Up,
  Down,
}
