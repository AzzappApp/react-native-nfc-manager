import { init } from '@paralleldrive/cuid2';

export const createId = () =>
  init({
    length: 12, //collision risk is 1 thousand years or 9B IDs
  })();
