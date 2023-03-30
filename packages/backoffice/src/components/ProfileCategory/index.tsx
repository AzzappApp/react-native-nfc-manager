import ProfileCategoryCreate from './ProfileCategoryCreate';
import ProfileCategoryEdit from './ProfileCategoryEdit';
import ProfileCategorysList from './ProfileCategoryList';

const resource = {
  name: 'ProfileCategory',
  list: ProfileCategorysList,
  create: ProfileCategoryCreate,
  edit: ProfileCategoryEdit,
  options: { label: 'Profile Categories' },
};

export default resource;
