import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { IconButton, Box, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { getImageURL, getVideoURL } from '@azzapp/shared/imagesHelpers';
import type { BoxProps } from '@mui/material';
import type { Variant } from '@mui/material/styles/createTypography';
import type { ChangeEvent, CSSProperties } from 'react';

type MediasListInputProps = Omit<BoxProps, 'onChange'> & {
  name: string;
  label: string;
  value: File | { kind: 'image' | 'video'; id: string } | null | undefined;
  kind: 'image' | 'video';
  titleVariant?: Variant;
  error?: boolean | null;
  helperText?: string | null;
  buttonLabel?: string;
  onChange: (media: File | null | undefined) => void;
  buttonStyle?: CSSProperties;
};

const MediaInput = ({
  name,
  label,
  value,
  error,
  kind,
  helperText,
  buttonLabel,
  onChange,
  titleVariant = 'h6',
  style,
  buttonStyle,
  ...props
}: MediasListInputProps) => {
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null);
  };

  const handleImageDelete = () => {
    onChange(null);
  };

  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let urlToClean: string | null = null;
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setSrc(url);
      urlToClean = url;
    } else if (value) {
      if (value.kind === 'image') {
        setSrc(getImageURL(value.id));
      } else {
        setSrc(getVideoURL(value.id));
      }
    } else {
      setSrc(null);
    }
    return () => {
      if (urlToClean) {
        URL.revokeObjectURL(urlToClean);
      }
    };
  }, [value]);

  return (
    <Box {...props}>
      <Typography variant={titleVariant} mb={2}>
        {label}
      </Typography>
      {error && <Typography color="error">{helperText}</Typography>}
      <Box style={{ position: 'relative' }} mb={2}>
        <div style={{ maxWidth: 120, ...style }}>
          {kind === 'video' && src && (
            <video
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              src={src!}
            />
          )}
          {kind === 'image' && src && (
            <img
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              src={src!}
            />
          )}
        </div>
        {value && (
          <IconButton
            onClick={handleImageDelete}
            sx={{
              position: 'absolute',
              top: 5,
              right: 5,
              backgroundColor: 'white',
              borderRadius: '50%',
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
      <Button component="label" variant="outlined" style={buttonStyle}>
        {buttonLabel || 'Add Media'}
        <input
          name={name}
          type="file"
          accept={kind === 'image' ? 'image/*' : 'video/*'}
          onChange={handleImageUpload}
          multiple
          hidden
        />
      </Button>
    </Box>
  );
};

export default MediaInput;
