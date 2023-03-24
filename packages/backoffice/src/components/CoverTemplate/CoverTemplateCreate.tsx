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
  const [imageDimension, setImageDimension] = useState<{
    width: number;
    height: number;
  }>();
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
        data.sourceMedia.id.rawFile,
        uploadURL,
        uploadParameters,
      );

      const { public_id } = await uploadPromise;
      data.sourceMedia = { ...imageDimension, id: public_id, kind: 'image' };

      if (colorPalette && colorPalette.length > 0) {
        rest.colorPalette = colorPalette;
      } else {
        delete rest.colorPalette;
      }

      rest.category = JSON.stringify({ en: category });
      //add mergeed and segmented also in data for simplification in frontend
      data.merged = dataForm.merged;
      data.segmented = dataForm.segmented;
      rest.data = data;

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
    return validateFormCover(values, imageDimension);
  };

  return (
    <Create
      transform={transform}
      aside={<CoverTemplatePreview values={changeValue} />}
    >
      <CoverTemplate
        validate={validateForm}
        setImageDimension={setImageDimension}
      />
    </Create>
  );
};

export default CoverTemplateCreate;
