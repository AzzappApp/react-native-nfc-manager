import { ADMIN } from '#roles';

export type SubSection = {
  text: string;
  href: string;
  roles: string[];
};

export type Section = {
  id: string;
  text: string;
  subSections: SubSection[];
};

const backOfficeSections: Section[] = [
  {
    id: 'userActivity',
    text: 'Users activity',
    subSections: [
      { text: 'Account', href: '/users', roles: [ADMIN] },
      {
        text: 'Moderation',
        href: '/moderations',
        roles: [ADMIN],
      },
      {
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
        text: 'Categories',
        href: '/webCardCategories',
        roles: [ADMIN],
      },
      {
        text: 'Activities',
        href: '/companyActivities',
        roles: [ADMIN],
      },
    ],
  },
  {
    id: 'webcards',
    text: 'Webcards',
    subSections: [
      {
        text: 'Styles',
        href: '/cardStyles',
        roles: [ADMIN],
      },
      { text: 'Colors', href: '/colorPalettes', roles: [ADMIN] },
      {
        text: 'Webcards templates',
        href: '/cardTemplates',
        roles: [ADMIN],
      },
      {
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
        text: 'Covers templates',
        href: '/coverTemplates',
        roles: [ADMIN],
      },
      {
        text: 'Covers templates types',
        href: '/coverTemplateTypes',
        roles: [ADMIN],
      },
      {
        text: 'Cover filters',
        href: '/coverFilters',
        roles: [ADMIN],
      },
      {
        text: 'Cover suggestions',
        href: '/suggestedMedias',
        roles: [ADMIN],
      },
    ],
  },
  {
    id: 'sections',
    text: 'Sections',
    subSections: [
      {
        text: 'Sections',
        href: '/sections',
        roles: [ADMIN],
      },
      {
        text: 'Sections types',
        href: '#',
        roles: [ADMIN],
      },
      {
        text: 'Sections backgrounds',
        href: '/staticMedias',
        roles: [ADMIN],
      },
    ],
  },
];

export default backOfficeSections;
