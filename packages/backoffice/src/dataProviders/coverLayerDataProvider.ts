import {
  getList,
  getMany,
  getOne,
  update,
  create,
} from './genericDataProvider';
import type { ResourceDataProvider } from './resourceDataProviders';
import type { CoverLayer } from '@azzapp/data/domains';

const CoverLayerDataProviders: ResourceDataProvider<CoverLayer> = {
  getList: params => getList('CoverLayer', params),
  getOne: params => getOne('CoverLayer', params),
  getMany: params => getMany('CoverLayer', params),
  update: params => {
    delete params.data.createdAt;
    return update('CoverLayer', params);
  },
  create: params => create('CoverLayer', params),
};

export default CoverLayerDataProviders;
