import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { IconButton, Box, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { getImageURL, getVideoURL } from '@azzapp/shared/imagesHelpers';
import type { BoxProps } from '@mui/material';
import type { ChangeEvent } from 'react';

type MediasListInputProps = Omit<BoxProps, 'onChange'> & {
  name: string;
  label: string;
  value: File | { kind: 'image' | 'video'; id: string } | null | undefined;
  kind: 'image' | 'video';
  error?: boolean | null;
  helperText?: string | null;
  onChange: (media: File | null | undefined) => void;
};

const MediaInput = ({
  name,
  label,
  value,
  error,
  kind,
  helperText,
  onChange,
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
      <Typography variant="h6">{label}</Typography>
      {error && <Typography color="error">{helperText}</Typography>}
      <Box style={{ position: 'relative' }}>
        {kind === 'video' ? (
          <video src={src!} style={{ maxWidth: 120 }} />
        ) : (
          <img src={src!} style={{ maxWidth: 120 }} />
        )}
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
      <Button component="label" variant="outlined">
        Add Media
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
