import {
  getList,
  getMany,
  getOne,
  update,
  create,
} from './genericDataProvider';
import type { ResourceDataProvider } from './resourceDataProviders';
import type { CompanyActivity } from '@azzapp/data/domains';

const CompanyActivityProviders: ResourceDataProvider<CompanyActivity> = {
  getList: params => getList('CompanyActivity', params),
  getOne: params => getOne('CompanyActivity', params as any), //can't understand why there is a typo error
  getMany: params => getMany('CompanyActivity', params),
  update: params => update('CompanyActivity', params as any),
  create: params => create('CompanyActivity', params as any),
};

export default CompanyActivityProviders;
