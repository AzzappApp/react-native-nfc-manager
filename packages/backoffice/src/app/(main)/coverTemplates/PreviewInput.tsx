import {
  getInputProps,
  useInputControl,
  type FieldMetadata,
} from '@conform-to/react';
import { Box, Button, CardMedia, Typography } from '@mui/material';
import { useRef, useState, type ChangeEvent } from 'react';
import { getVideoURL } from '@azzapp/shared/imagesHelpers';

type Props = {
  previewField: FieldMetadata<File | undefined>;
  previewIdField: FieldMetadata<string>;
};

const PreviewInput = ({ previewField, previewIdField }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewInput = useInputControl(previewField as any);
  const [src, setSrc] = useState<any>(
    previewIdField.initialValue ? getVideoURL(previewIdField.initialValue) : '',
  );

  const onLoadFile = (event: ChangeEvent<any>) => {
    if (event.target.files[0]) {
      setSrc(URL.createObjectURL(event.target.files[0]));
      previewInput.change(event.target.files[0]);
    }
  };

  return (
    <Box>
      {src && (
        <Box height={200} width={100}>
          <CardMedia
            sx={{ height: 200, width: 100 }}
            component="video"
            title="preview"
            image={src}
            autoPlay
            loop
            muted
          />
        </Box>
      )}

      {previewIdField.initialValue && (
        <input
          {...getInputProps(previewIdField, { type: 'hidden' })}
          key={previewIdField.key}
        />
      )}
      <input
        ref={inputRef}
        {...getInputProps(previewField, { type: 'file' })}
        key={previewField.key}
        accept={'video/*'}
        style={{
          display: 'none',
        }}
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.value = '';
          }
        }}
        onChange={onLoadFile}
      />
      {(previewField.errors || previewIdField.errors) && (
        <Typography sx={{ mb: 2 }} variant="body1" color="error">
          Preview is required
        </Typography>
      )}
      <Box display="flex" alignItems="center">
        <Button variant="contained" type="button">
          <Typography
            variant="button"
            component="label"
            htmlFor={previewField.id}
          >
            LOAD PREVIEW
          </Typography>
        </Button>
      </Box>
    </Box>
  );
};

export default PreviewInput;
