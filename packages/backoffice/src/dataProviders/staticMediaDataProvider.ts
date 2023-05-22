import {
  getList,
  getMany,
  getOne,
  update,
  create,
} from './genericDataProvider';
import type { ResourceDataProvider } from './resourceDataProviders';
import type { StaticMedia } from '@azzapp/data/domains';

const StaticMediaDataProviders: ResourceDataProvider<StaticMedia> = {
  getList: params => getList('StaticMedia', params),
  getOne: params => getOne('StaticMedia', params),
  getMany: params => getMany('StaticMedia', params),
  update: params => {
    delete params.data.createdAt;
    return update('StaticMedia', params);
  },
  create: params => create('StaticMedia', params),
};

export default StaticMediaDataProviders;
