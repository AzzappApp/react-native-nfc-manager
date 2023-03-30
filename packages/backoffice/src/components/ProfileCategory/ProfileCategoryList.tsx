import {
  BooleanField,
  Datagrid,
  List,
  NumberField,
  TextField,
} from 'react-admin';

const ProfileCategoryList = () => {
  return (
    <List
      exporter={false}
      hasCreate
      hasEdit
      sort={{ field: 'order', order: 'asc' }}
    >
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <BooleanField source="available" looseValue />
        <TextField label="Name" source="labels.en" />
        <TextField label="ProfileKind" source="profileKind" />
        <NumberField label="Order" source="order" />
      </Datagrid>
    </List>
  );
};

export default ProfileCategoryList;
