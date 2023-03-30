import * as React from 'react';
import { Create } from 'react-admin';
import InterestForm from './InterestForm';

const InterestCreate = () => {
  const transform = async (dataForm: Record<string, any>) => {
    //doing it here becase we need to run on client side (localstorage not found on backoffice)
    const { labels, tag } = dataForm;
    return {
      tag,
      labels: JSON.stringify(labels),
    };
  };

  return (
    <Create transform={transform}>
      <InterestForm />
    </Create>
  );
};

export default InterestCreate;
