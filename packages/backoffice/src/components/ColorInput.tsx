import { Box, TextField } from '@mui/material';

const ColorInput = ({
  name,
  value,
  label,
  disabled,
  required,
  error,
  helperText,
  onChange,
}: {
  name: string;
  value?: string | null;
  label: string;
  disabled: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  onChange?: (value: string) => void;
}) => {
  const onChangeInner = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.length > 7 || (value && !/^#[0-9ABCDEF]*$/i.test(value))) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      onChange?.(value);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
      <TextField
        name={name}
        value={value}
        label={label}
        onChange={onChangeInner}
        required={required}
        disabled={disabled}
        error={error}
        helperText={helperText}
      />
      <Box
        sx={{
          border: `1px solid #000`,
          width: 50,
          background: value ?? 'transparent',
        }}
      />
    </Box>
  );
};

export default ColorInput;
