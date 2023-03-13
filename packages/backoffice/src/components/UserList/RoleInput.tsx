import * as React from 'react';
import { SelectArrayInput } from 'react-admin';

import type { SelectArrayInputProps } from 'react-admin';

const RoleInput = (props: SelectArrayInputProps) => {
  return <SelectArrayInput {...props} source="roles" choices={segments} />;
};

export default RoleInput;

const segments = [{ id: 'admin', name: 'Admin' }];
