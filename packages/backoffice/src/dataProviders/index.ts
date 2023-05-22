import CompanyActivityProviders from './companyActivityProvider';
import CoverTemplateDataProviders from './coverTemplateDataProvider';
import InterestDataProviders from './interestsDataProvider';
import ProfileCategoryDataProviders from './profileCategoryDataProvider';
import {
  executeCommand,
  registerResourceDataProvider,
} from './resourceDataProviders';
import StaticMediaDataProviders from './staticMediaDataProvider';
import UserDataProviders from './usersDataProviders';

registerResourceDataProvider(
  'StaticMedia',
  StaticMediaDataProviders,
  ['admin'],
  ['admin'],
);

registerResourceDataProvider(
  'CoverTemplate',
  CoverTemplateDataProviders,
  ['admin'],
  ['admin'],
);

registerResourceDataProvider(
  'ProfileCategory',
  ProfileCategoryDataProviders,
  ['admin'],
  ['admin'],
);

registerResourceDataProvider(
  'CompanyActivity',
  CompanyActivityProviders,
  ['admin'],
  ['admin'],
);

registerResourceDataProvider('User', UserDataProviders, ['admin'], ['admin']);

registerResourceDataProvider(
  'Interest',
  InterestDataProviders,
  ['admin'],
  ['admin'],
);

export { executeCommand };
