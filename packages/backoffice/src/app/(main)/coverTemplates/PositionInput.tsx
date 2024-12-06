'use client';

import { getInputProps } from '@conform-to/react';
import { TextField } from '@mui/material';
import type { PositionSchemaType } from './coverTemplateSchema';
import type { FieldMetadata } from '@conform-to/react';

type Props = {
  field: FieldMetadata<PositionSchemaType>;
};

const DEFAULT = 50;

const PositionInput = ({ field }: Props) => {
  const fields = field.getFieldset();

  return (
    <>
      <TextField
        label="X"
        sx={{ flex: 1 }}
        required
        error={!!field.errors}
        inputProps={{
          min: '0',
          max: '100',
          step: 'any',
          defaultValue: fields.x.initialValue || DEFAULT,
        }}
        {...getInputProps(fields.x, { type: 'number' })}
        key={fields.x.key}
      />
      <TextField
        label="Y"
        sx={{ flex: 1 }}
        required
        error={!!field.errors}
        inputProps={{
          min: '0',
          max: '100',
          step: 'any',
          defaultValue: fields.y.initialValue || DEFAULT,
        }}
        {...getInputProps(fields.y, { type: 'number' })}
        key={fields.y.key}
      />
    </>
  );
};

export default PositionInput;
