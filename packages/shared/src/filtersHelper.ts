export const FILTERS = [
  'nah',
  'once',
  'passing_by',
  'serenity',
  'solar',
  'undeniable',
  'undeniable2',
  'you_can_do_it',
  'pure',
  'syrah',
  'paper',
  'rock',
  'vouzon',
  'transparency',
  'autumn',
  'one_of_us',
  'bourbon',
  'black_and_white_light',
  'black_and_white_neutral',
  'black_and_white_old',
] as const;

export type Filter = (typeof FILTERS)[number];
