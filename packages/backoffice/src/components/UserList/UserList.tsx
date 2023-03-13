/* eslint-disable react/jsx-key */
import { useCallback } from 'react';
import {
  Datagrid,
  DateField,
  EmailField,
  FunctionField,
  List,
  SearchInput,
  TextField,
} from 'react-admin';

const UserList = () => {
  const renderIsAdmin = useCallback((record: any) => {
    const isAdmin = record.roles?.includes('admin');
    return isAdmin ? <span style={{ color: 'red' }}>Admin</span> : 'User';
  }, []);
  return (
    <List exporter={false} filters={orderFilters}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
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

const orderFilters = [<SearchInput source="email" alwaysOn />];
