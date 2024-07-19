import {
  getInputProps,
  useInputControl,
  type FieldMetadata,
} from '@conform-to/react';
import { TextField } from '@mui/material';
import { useState, type ChangeEvent } from 'react';

type Props = {
  field: FieldMetadata<number>;
  label: string;
};

const RadianInput = ({ field, label }: Props) => {
  const radianInput = useInputControl(field);
  const [degree, setDegree] = useState(() => {
    let value = 0;
    if (field.value) {
      value = parseFloat(field?.value) * (180 / Math.PI);
    }

    radianInput.change(value.toString());
    return value;
  });

  const onChangeDegree = (event: ChangeEvent<HTMLInputElement>) => {
    const degree = parseInt(event.target.value, 10);
    setDegree(degree);
    radianInput.change((degree * (Math.PI / 180)).toString());
  };

  return (
    <>
      <TextField
        label={label}
        sx={{ flex: 1 }}
        required
        error={!!field.errors}
        value={degree}
        onChange={onChangeDegree}
        type="number"
      />
      <input
        {...getInputProps(field, {
          type: 'hidden',
        })}
        key={field.key}
      />
    </>
  );
};

export default RadianInput;
