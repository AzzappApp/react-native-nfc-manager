import CoverTemplateCreate from './CoverTemplateCreate';
import CoverTemplateEdit from './CoverTemplateEdit';
import CoverTemplateList from './CoverTemplateList';

const resource = {
  name: 'CoverTemplate',
  list: CoverTemplateList,
  create: CoverTemplateCreate,
  edit: CoverTemplateEdit,
  options: { label: 'Cover Templates' },
};

export default resource;
