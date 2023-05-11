import ERRORS from '@azzapp/shared/errors';
import type { User } from '@azzapp/data/domains';
import type {
  CreateParams,
  CreateResult,
  DeleteParams,
  GetListParams,
  GetListResult,
  GetManyParams,
  GetManyResult,
  GetOneParams,
  GetOneResult,
  RaRecord,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
} from 'react-admin';

export type ResourceDataProvider<
  TRecord extends RaRecord,
  TRecordOne extends RaRecord = TRecord,
> = {
  getList(params: GetListParams): Promise<GetListResult<TRecord>>;
  getOne(params: GetOneParams<TRecordOne>): Promise<GetOneResult<TRecordOne>>;
  getMany(params: GetManyParams): Promise<GetManyResult<TRecord>>;
  update?(params: UpdateParams<TRecordOne>): Promise<UpdateResult<TRecordOne>>;
  updateMany?(
    params: UpdateManyParams<TRecordOne>,
  ): Promise<UpdateManyResult<TRecordOne>>;
  create?(params: CreateParams<TRecordOne>): Promise<CreateResult<TRecordOne>>;
};

export type Resources =
  | 'CompanyActivity'
  | 'CoverLayer'
  | 'CoverTemplate'
  | 'Interest'
  | 'ProfileCategory'
  | 'User';

const resourcesDataProviders: Map<
  Resources,
  {
    dataProvider: ResourceDataProvider<any>;
    readRoles: string[];
    writeRoles: string[];
  }
> = new Map();

type GetOneCommand = {
  command: 'getOne';
  resource: Resources;
  params: GetOneParams;
};

type GetListCommand = {
  command: 'getList';
  resource: Resources;
  params: GetListParams;
};

type GetManyCommand = {
  command: 'getMany';
  resource: Resources;
  params: GetManyParams;
};

type UpdateCommand = {
  command: 'update';
  resource: Resources;
  params: UpdateParams;
};

type UpdateManyCommand = {
  command: 'updateMany';
  resource: Resources;
  params: UpdateParams;
};

type CreateCommand = {
  command: 'create';
  resource: Resources;
  params: CreateParams;
};

type DeleteCommand = {
  command: 'delete';
  resource: Resources;
  params: DeleteParams;
};

type DeleteManyCommand = {
  command: 'deleteMany';
  resource: Resources;
  params: DeleteParams;
};

type Command =
  | CreateCommand
  | DeleteCommand
  | DeleteManyCommand
  | GetListCommand
  | GetManyCommand
  | GetOneCommand
  | UpdateCommand
  | UpdateManyCommand;

const readCommands = ['getOne', 'getList', 'getMany'];
const writeCommands = [
  'update',
  'updateMany',
  'create',
  'delete',
  'deleteMany',
];

export const registerResourceDataProvider = (
  resource: Resources,
  dataProvider: ResourceDataProvider<any>,
  readRoles: string[],
  writeRoles: string[],
) => {
  resourcesDataProviders.set(resource, {
    dataProvider,
    readRoles,
    writeRoles,
  });
};

export const executeCommand = async (
  { command, resource, params }: Command,
  user: User,
) => {
  const resourceOptions = resourcesDataProviders.get(resource);
  if (!resourceOptions) {
    throw new Error(`No data provider for resource ${resource}`);
  }
  const { dataProvider, readRoles, writeRoles } = resourceOptions;
  const roles = (user.roles as string[] | undefined) ?? [];
  if (
    readCommands.includes(command) &&
    !roles.some(role => readRoles.includes(role))
  ) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  if (
    writeCommands.includes(command) &&
    !roles.some(role => writeRoles.includes(role))
  ) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  if (command === 'delete' || command === 'deleteMany') {
    // Not supported yet
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  const method = dataProvider[command];
  if (!method) {
    // Not supported yet
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  return method(params as any);
};
