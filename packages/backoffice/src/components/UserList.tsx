import { useCallback } from 'react';
import {
  Datagrid,
  DateField,
  EmailField,
  FunctionField,
  List,
  TextField,
} from 'react-admin';

const UserList = () => {
  const renderIsAdmin = useCallback((record: any) => {
    const isAdmin = record.roles?.includes('admin');
    return isAdmin ? <span style={{ color: 'red' }}>Admin</span> : 'User';
  }, []);
  return (
    <List exporter={false}>
      <Datagrid>
        <TextField label="Id" source="id" />
        <EmailField label="Email" source="email" />
        <TextField label="Phone number" source="phoneNumber" />
        <FunctionField label="Privileges" render={renderIsAdmin} />
        <DateField label="Inscription Date" source="createdAt" />
      </Datagrid>
    </List>
  );
};

export default UserList;
