'use client';

import { getInputProps, useInputControl } from '@conform-to/react';
import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';
import { getCloudinaryAssetURL } from '@azzapp/service/mediaServices/imageHelpers';
import type { FieldMetadata } from '@conform-to/react';

type Props = {
  field: FieldMetadata<File | undefined>;
  buttonLabel: string;
  imageId?: string;
};

const LogoInputRow = ({ field, imageId, buttonLabel }: Props) => {
  const imageField = useInputControl(field as any);
  const [image, setImage] = useState(
    imageId ? getCloudinaryAssetURL(imageId, 'image') : '',
  );

  const onImageChange = (event: any) => {
    if (event.target.files && event.target.files[0]) {
      setImage(URL.createObjectURL(event.target.files[0]));
      imageField.change(event.target.files[0]);
    }
  };

  return (
    <Box display="flex" gap={2}>
      <div
        style={{
          width: 100,
          height: 100,
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid lightGrey',
        }}
      />
      <Box display="flex" alignItems="center">
        <Button variant="contained" type="button">
          <Typography variant="button" component="label" htmlFor={field.id}>
            {buttonLabel}
          </Typography>
        </Button>
      </Box>
      <input
        {...getInputProps(field, { type: 'file' })}
        key={field.key}
        accept="image/*"
        style={{
          display: 'none',
        }}
        onChange={onImageChange}
      />
    </Box>
  );
};

export default LogoInputRow;
