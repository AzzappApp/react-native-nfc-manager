import { Datagrid, List, TextField } from 'react-admin';

const InterestList = () => {
  return (
    <List
      exporter={false}
      hasCreate
      hasEdit
      sort={{ field: 'tag', order: 'asc' }}
    >
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField label="Label" source="labels.en" />
        <TextField label="Tag" source="tag" />
      </Datagrid>
    </List>
  );
};

export default InterestList;
