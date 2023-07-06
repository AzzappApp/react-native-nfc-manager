import * as React from 'react';
import { Edit } from 'react-admin';
import InterestForm from './InterestForm';

const InterestEdit = () => {
  const transform = async (dataForm: Record<string, any>) => {
    //doing it here becase we need to run on client side (localstorage not found on backoffice)
    const { id, labels, tag } = dataForm;
    return {
      id,
      tag,
      labels,
    };
  };

  return (
    <Edit transform={transform}>
      <InterestForm />
    </Edit>
  );
};

export default InterestEdit;
