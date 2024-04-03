import { Box, FormControl, FormHelperText, FormLabel } from '@mui/material';
import { getImageURL } from '@azzapp/shared/imagesHelpers';
import type { StaticMedia } from '@azzapp/data';

type StaticMediaSelectionListProps = {
  value: string | null | undefined;
  onChange: (value: string | null | undefined) => void;
  error?: boolean;
  helperText?: string | null;
  label: string;
  staticMedias: StaticMedia[];
};

const StaticMediaSelectionList = ({
  value,
  onChange,
  error,
  helperText,
  label,
  staticMedias,
}: StaticMediaSelectionListProps) => (
  <FormControl error={error}>
    <FormLabel>{label}</FormLabel>
    <Box sx={{ display: 'flex', overflow: 'auto' }} role="listbox">
      {staticMedias.map(staticMedia => (
        <Box
          component="button"
          type="button"
          aria-selected={value === staticMedia.id}
          key={staticMedia.id}
          sx={{
            width: 120,
            height: 120,
            backgroundColor:
              value === staticMedia.id ? 'primary.main' : 'transparent',
            border: '1px solid #000',
          }}
          onClick={() =>
            onChange(value === staticMedia.id ? null : staticMedia.id)
          }
        >
          <img
            src={getImageURL(staticMedia.id)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>
      ))}
    </Box>
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
);

export default StaticMediaSelectionList;
