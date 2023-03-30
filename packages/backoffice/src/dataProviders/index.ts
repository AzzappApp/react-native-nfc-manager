import CoverLayerDataProviders from './coverLayerDataProvider';
import CoverTemplateDataProviders from './coverTemplateDataProvider';
import InterestDataProviders from './interestsDataProvider';
import ProfileCategoryDataProviders from './profileCategoryDataProvider';
import {
  executeCommand,
  registerResourceDataProvider,
} from './resourceDataProviders';
import UserDataProviders from './usersDataProviders';

registerResourceDataProvider(
  'CoverLayer',
  CoverLayerDataProviders,
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

registerResourceDataProvider('User', UserDataProviders, ['admin'], ['admin']);

registerResourceDataProvider(
  'Interest',
  InterestDataProviders,
  ['admin'],
  ['admin'],
);

export { executeCommand };
