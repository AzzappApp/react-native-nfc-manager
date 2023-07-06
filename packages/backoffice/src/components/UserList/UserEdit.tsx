import * as React from 'react';
import {
  Edit,
  SaveButton,
  SimpleForm,
  TextField,
  Toolbar,
  useRecordContext,
} from 'react-admin';
import RoleInput from './RoleInput';

const transform = (data: Record<string, string>) => {
  return { id: data.id, roles: data.roles };
};

const UserEdit = () => {
  return (
    <Edit title={<UserTitle />} transform={transform}>
      <SimpleForm
        toolbar={
          <Toolbar>
            <SaveButton label="Save" />
          </Toolbar>
        }
      >
        <TextField source="email" />
        <RoleInput />
      </SimpleForm>
    </Edit>
  );
};

const UserTitle = () => {
  const record = useRecordContext();
  return <span>User {record ? `"${record.email}"` : ''}</span>;
};

export default UserEdit;
