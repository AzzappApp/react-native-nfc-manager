import React, { useState } from 'react';
import { Edit } from 'react-admin';

import { uploadSign, uploadMedia } from '@azzapp/shared/WebAPI';
import { injectToken } from '#App';

import { getTokens } from '#helpers/tokenStore';
import CoverTemplate from './CoverTemplate';
import CoverTemplatePreview from './CoverTemplatePreview';
import { validateFormCover } from './CoverValidator';

const CoverTemplateEdit = () => {
  const [changeValue, setChangeValue] = useState<any>({});
  const [imageDimension, setImageDimension] = useState<{
    width: number;
    height: number;
  }>();
  const [imagePreviewDimension, setImagePreviewDimension] = useState<{
    width: number;
    height: number;
  }>();
  const transform = async (dataForm: Record<string, any>) => {
    const {
      data,
      category,
      colorPalette,
      previewMediaId,
      companyActivities,
      suggested,
      ...rest
    } = dataForm;

    try {
      if (suggested && data.sourceMedia.id?.rawFile != null) {
        const { uploadURL, uploadParameters } = await uploadSign(
          {
            kind: 'image',
            target: 'cover', //maybe create a target static media
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
      }
      if (suggested && previewMediaId.rawFile != null) {
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
        data.sourceMedia = {
          ...imagePreviewDimension,
          id: public_id,
          kind: 'image',
        };
      }

      if (colorPalette && colorPalette.length > 0) {
        rest.colorPalette = colorPalette;
      } else {
        delete rest.colorPalette;
      }

      rest.suggested = suggested;
      // convert companyActivity array of string into string separated by comma
      if (suggested && companyActivities && companyActivities.length > 0) {
        rest.companyActivityIds = companyActivities.join(',');
      } else {
        rest.companyActivityIds = null;
      }
      rest.category = category;

      data.merged = dataForm.merged;
      data.segmented = dataForm.segmented;

      rest.data = data;
      return rest;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  };

  const validateForm = (values: Record<string, any>): Record<string, any> => {
    // without assign nothing go rerender
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
    return validateFormCover(values, imageDimension, imagePreviewDimension);
  };

  return (
    <Edit
      transform={transform}
      aside={<CoverTemplatePreview values={changeValue} />}
    >
      <CoverTemplate
        validate={validateForm}
        setImageDimension={setImageDimension}
        setImagePreviewDimension={setImagePreviewDimension}
      />
    </Edit>
  );
};

export default CoverTemplateEdit;
