import UserEdit from './UserEdit';

import UserList from './UserList';

const resource = {
  name: 'User',
  list: UserList,
  edit: UserEdit,
  options: { label: 'Users' },
};

export default resource;
