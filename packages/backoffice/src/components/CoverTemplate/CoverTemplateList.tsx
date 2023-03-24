import {
  Datagrid,
  DateField,
  FunctionField,
  List,
  TextField,
} from 'react-admin';
import CoverTemplatePreview from './CoverTemplatePreview';

const CoverTempalteList = () => {
  return (
    <List exporter={false} hasCreate hasEdit>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <FunctionField
          label="Image"
          render={(record: any) => {
            return (
              <CoverTemplatePreview
                values={record.data}
                containerHeight={100}
                thumbnail
              />
            );
          }}
        />
        <TextField label="Name" source="name" />
        <TextField label="Category" source="category.en" />
        <DateField label="Creation Date" source="createdAt" />
      </Datagrid>
    </List>
  );
};

export default CoverTempalteList;
