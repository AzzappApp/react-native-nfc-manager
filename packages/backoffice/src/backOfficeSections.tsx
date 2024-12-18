import { ADMIN } from '#roles';

export type SubSection = {
  id: string;
  text: string;
  href: string;
  roles: string[];
  badge?: number;
};

export type Section = {
  id: string;
  text: string;
  subSections: SubSection[];
};

const backOfficeSections: Array<Section | SubSection> = [
  {
    id: 'userActivity',
    text: 'Users activity',
    subSections: [
      { id: 'account', text: 'Account', href: '/users', roles: [ADMIN] },
      {
        id: 'subscriptions',
        text: 'Subscriptions',
        href: '/subscriptions',
        roles: [ADMIN],
      },
      {
        id: 'moderations',
        text: 'Moderation',
        href: '/moderations',
        roles: [ADMIN],
      },
      {
        id: 'metrics',
        text: 'Metrics',
        href: '/metrics',
        roles: [ADMIN],
      },
    ],
  },
  {
    id: 'profileType',
    text: 'Profiles types',
    subSections: [
      {
        id: 'webCardCategories',
        text: 'Categories',
        href: '/webCardCategories',
        roles: [ADMIN],
      },
      {
        id: 'companyActivities',
        text: 'Activities',
        href: '/companyActivities',
        roles: [ADMIN],
      },
      {
        id: 'companyActivitiesTypes',
        text: 'Activities Types',
        href: '/companyActivitiesTypes',
        roles: [ADMIN],
      },
    ],
  },
  {
    id: 'webcards',
    text: 'Webcards',
    subSections: [
      {
        id: 'cardStyles',
        text: 'Styles',
        href: '/cardStyles',
        roles: [ADMIN],
      },
      { id: 'colors', text: 'Colors', href: '/colorPalettes', roles: [ADMIN] },
      {
        id: 'cardTemplates',
        text: 'Webcards templates',
        href: '/cardTemplates',
        roles: [ADMIN],
      },
      {
        id: 'cardTemplateTypes',
        text: 'Webcards templates types',
        href: '/cardTemplateTypes',
        roles: [ADMIN],
      },
    ],
  },
  {
    id: 'covers',
    text: 'Covers',
    subSections: [
      {
        id: 'coverTemplates',
        text: 'Covers templates',
        href: '/coverTemplates',
        roles: [ADMIN],
      },
      {
        id: 'coverTemplateTypes',
        text: 'Covers templates types',
        href: '/coverTemplateTypes',
        roles: [ADMIN],
      },
      {
        id: 'coverTemplateFilters',
        text: 'Cover template filters',
        href: '/coverTemplateFilters',
        roles: [ADMIN],
      },
    ],
  },
  {
    id: 'sections',
    text: 'Sections',
    subSections: [
      {
        id: 'sections',
        text: 'Sections',
        href: '/sections',
        roles: [ADMIN],
      },
      {
        id: 'sectionsTypes',
        text: 'Sections types',
        href: '#',
        roles: [ADMIN],
      },
      {
        id: 'moduleBackgrounds',
        text: 'Modules backgrounds',
        href: '/moduleBackgrounds',
        roles: [ADMIN],
      },
    ],
  },
];

export default backOfficeSections;
