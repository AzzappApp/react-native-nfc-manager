import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import type { FormControlProps } from '@mui/material';

type FontSelectProps = Omit<FormControlProps, 'onChange'> & {
  name: string;
  label: string;
  value?: string | null;
  onChange?: (value: string) => void;
  helperText?: string;
  fontList: string[];
};

const FontSelect = ({
  name,
  label,
  value,
  helperText,
  onChange,
  fontList,
  ...props
}: FontSelectProps) => (
  <FormControl fullWidth {...props}>
    <InputLabel id={`${name}-label`}>{label}</InputLabel>
    <Select
      labelId={`${name}-label`}
      id={name}
      name={name}
      value={value}
      label={label}
      onChange={onChange ? e => onChange(e.target.value as string) : undefined}
    >
      {fontList.map(font => (
        <MenuItem key={font} value={font}>
          {font}
        </MenuItem>
      ))}
    </Select>
    <FormHelperText>{helperText}</FormHelperText>
  </FormControl>
);

export default FontSelect;
