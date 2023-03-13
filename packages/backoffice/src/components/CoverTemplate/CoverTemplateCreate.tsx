import React, { useState } from 'react';
import { Create } from 'react-admin';

import { uploadSign, uploadMedia } from '@azzapp/shared/WebAPI';
import { injectToken } from '#App';
import { getTokens } from '#helpers/tokenStore';
import CoverTemplate from './CoverTemplate';
import CoverTemplatePreview from './CoverTemplatePreview';
import { validateFormCover } from './CoverValidator';

const CoverTemplateCreate = () => {
  const [changeValue, setChangeValue] = useState<any>({});
  const transform = async (dataForm: Record<string, any>) => {
    const { data, category, colorPalette, ...rest } = dataForm;
    try {
      const { uploadURL, uploadParameters } = await uploadSign(
        {
          kind: 'image',
          target: 'cover', //maybe create a target coverlayer
        },
        injectToken(getTokens()?.token ?? undefined),
      );

      const { promise: uploadPromise } = uploadMedia(
        data.sourceMediaId.rawFile,
        uploadURL,
        uploadParameters,
      );

      const { public_id } = await uploadPromise;
      data.sourceMediaId = public_id;

      if (colorPalette && colorPalette.length > 0) {
        rest.colorPalette = colorPalette;
      } else {
        delete rest.colorPalette;
      }

      rest.category = JSON.stringify(category);
      rest.data = JSON.stringify(data);

      return rest;
    } catch (error) {
      console.log(error);
    }
  };

  const validateForm = (values: Record<string, any>): Record<string, any> => {
    setChangeValue(
      Object.assign(
        {},
        {
          ...values.data,
          merged: values.merged,
          segmented: values.segmented,
        },
      ),
    );
    return validateFormCover(values);
  };

  return (
    <Create
      transform={transform}
      aside={<CoverTemplatePreview values={changeValue} />}
    >
      <CoverTemplate validate={validateForm} />
    </Create>
  );
};

export default CoverTemplateCreate;
