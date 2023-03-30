import {
  getList,
  getMany,
  getOne,
  update,
  create,
} from './genericDataProvider';
import type { ResourceDataProvider } from './resourceDataProviders';
import type { Interest } from '@azzapp/data/domains';

const InterestDataProviders: ResourceDataProvider<Interest> = {
  getList: params => getList('Interest', params),
  getOne: params => getOne('Interest', params),
  getMany: params => getMany('Interest', params),
  update: params => update('Interest', params),
  create: params => create('Interest', params),
};

export default InterestDataProviders;
