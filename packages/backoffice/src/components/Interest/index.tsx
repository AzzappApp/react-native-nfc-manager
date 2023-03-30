import InterestCreate from './InterestCreate';
import InterestEdit from './InterestEdit';
import InterestList from './InterestList';

const resource = {
  name: 'Interest',
  list: InterestList,
  create: InterestCreate,
  edit: InterestEdit,
  options: { label: 'Interests' },
};

export default resource;
