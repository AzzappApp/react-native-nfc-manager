import { ADMIN } from '#roles';

const backOfficeSections = [
  { text: 'Users', href: '/users', roles: [ADMIN] },
  { text: 'Colors', href: '/colorPalettes', roles: [ADMIN] },
  {
    text: 'Card Styles',
    href: '/cardStyles',
    roles: [ADMIN],
  },
  {
    text: 'Profile Categories',
    href: '/profileCategories',
    roles: [ADMIN],
  },
  {
    text: 'Medias',
    href: '/staticMedias',
    roles: [ADMIN],
  },
  {
    text: 'Cover Suggestions',
    href: '/suggestedMedias',
    roles: [ADMIN],
  },
  {
    text: 'Cover Templates',
    href: '/coverTemplates',
    roles: [ADMIN],
  },
  {
    text: 'Card Templates',
    href: '/cardTemplates',
    roles: [ADMIN],
  },
];

export default backOfficeSections;
