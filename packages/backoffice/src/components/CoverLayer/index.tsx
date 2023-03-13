import CoverLayerCreate from './CoverLayerCreate';
import CoverLayerEdit from './CoverLayerEdit';
import CoverLayersList from './CoverLayerList';

const resource = {
  name: 'CoverLayer',
  list: CoverLayersList,
  create: CoverLayerCreate,
  edit: CoverLayerEdit,
  options: { label: 'Cover Layers' },
};

export default resource;
