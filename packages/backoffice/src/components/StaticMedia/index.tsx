import StaticMediaCreate from './StaticMediaCreate';
import StaticMediaEdit from './StaticMediaLayerEdit';
import StaticMediasList from './StaticMediaLayerList';

const resource = {
  name: 'StaticMedia',
  list: StaticMediasList,
  create: StaticMediaCreate,
  edit: StaticMediaEdit,
  options: { label: 'Cover Layers' },
};

export default resource;
