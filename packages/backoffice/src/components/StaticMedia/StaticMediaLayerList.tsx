import { useCallback } from 'react';
import {
  BooleanField,
  Datagrid,
  DateField,
  FunctionField,
  List,
  TextField,
} from 'react-admin';
import CloudinaryImageField from '#components/CloudinaryImageField';
import StaticMediaListAside from './StaticMediaListAside';

const StaticMediaList = () => {
  const renderType = useCallback((record: any) => {
    switch (record.usage) {
      case 'coverForeground':
        return (
          <span
            style={{
              color: 'white',
              fontWeight: 'bold',
              backgroundColor: '#98ddfc',
              borderRadius: 20,
              padding: 10,
            }}
          >
            Cover Foreground
          </span>
        );
      case 'coverBackground':
        return (
          <span
            style={{
              color: 'white',
              fontWeight: 'bold',
              backgroundColor: '#8ee8d8',
              borderRadius: 20,
              padding: 10,
            }}
          >
            Cover Background
          </span>
        );
      default:
        return (
          <span
            style={{
              color: 'white',
              fontWeight: 'bold',
              backgroundColor: '#8ee8d8',
              borderRadius: 20,
              padding: 10,
            }}
          >
            Modul Background
          </span>
        );
    }
  }, []);

  return (
    <List exporter={false} hasCreate hasEdit aside={<StaticMediaListAside />}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <BooleanField source="available" looseValue />
        <FunctionField
          label="Image"
          render={(record: any) => {
            return <CloudinaryImageField id={record?.id} />;
          }}
        />

        <FunctionField label="Type" render={renderType} />
        <TextField label="Resize Mode" source="resizeMode" />
        <TextField label="Name" source="name" />
        <DateField label="Creation Date" source="createdAt" />
      </Datagrid>
    </List>
  );
};

export default StaticMediaList;
