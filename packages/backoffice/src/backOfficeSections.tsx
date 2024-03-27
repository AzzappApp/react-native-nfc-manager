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
    href: '/webCardCategories',
    roles: [ADMIN],
  },
  {
    text: 'Company Activities',
    href: '/companyActivities',
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
  {
    text: 'Card Template Types',
    href: '/cardTemplateTypes',
    roles: [ADMIN],
  },
  {
    text: 'Reports',
    href: '/reports',
    roles: [ADMIN],
  },
];

export default backOfficeSections;
