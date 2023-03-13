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
import CoverLayerListAside from './CoverLayerListAside';

const CoverLayerList = () => {
  const renderType = useCallback((record: any) => {
    if (record.kind === 'foreground') {
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
          Foreground
        </span>
      );
    } else {
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
          Background
        </span>
      );
    }
  }, []);

  return (
    <List exporter={false} hasCreate hasEdit aside={<CoverLayerListAside />}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <BooleanField source="available" looseValue />
        <FunctionField
          label="Image"
          render={(record: any) => {
            return <CloudinaryImageField id={record?.id} />;
          }}
        />

        <FunctionField label="Type" render={renderType} />
        <TextField label="Name" source="name" />
        <DateField label="Creation Date" source="createdAt" />
      </Datagrid>
    </List>
  );
};

export default CoverLayerList;
