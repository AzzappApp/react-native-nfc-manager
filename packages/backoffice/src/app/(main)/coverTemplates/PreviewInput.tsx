import {
  getInputProps,
  useInputControl,
  type FieldMetadata,
} from '@conform-to/react';
import {
  Box,
  Button,
  CardMedia,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useRef, useState, type ChangeEvent } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  getVideoThumbnailURL,
  getVideoURL,
} from '@azzapp/shared/imagesHelpers';

type Props = {
  previewField: FieldMetadata<File | undefined>;
  previewIdField: FieldMetadata<string>;
  previewPositionPercentage: FieldMetadata<number | null>;
};

const PreviewInput = ({
  previewField,
  previewIdField,
  previewPositionPercentage,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewInput = useInputControl(previewField as any);
  const [src, setSrc] = useState<any>(
    previewIdField.initialValue ? getVideoURL(previewIdField.initialValue) : '',
  );

  const [previewPosition, setPreviewPosition] = useState<number | undefined>(
    previewPositionPercentage.initialValue
      ? parseInt(previewPositionPercentage.initialValue, 10)
      : undefined,
  );

  const onLoadFile = (event: ChangeEvent<any>) => {
    if (event.target.files[0]) {
      setSrc(URL.createObjectURL(event.target.files[0]));
      previewInput.change(event.target.files[0]);
    }
  };

  const previewImageWithPercentage = getVideoThumbnailURL({
    id: previewIdField.initialValue ?? '',
    width: 100,
    previewPositionPercentage: previewPosition,
  });

  const onPreviewPercentageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    if (!Number.isNaN(value)) {
      let iValue = value as unknown as number;
      if (iValue < 0) {
        iValue = 0;
      } else if (iValue > 100) {
        iValue = 100;
      }
      setPreviewPosition(iValue);
    } else {
      setPreviewPosition(0);
    }
  };
  const debouncedPreviewChange = useDebouncedCallback(
    onPreviewPercentageChange,
    300,
  );

  return (
    <Box>
      {src && (
        <Box height={300} width="100%">
          <Grid container columns={2}>
            <CardMedia
              sx={{ height: 200, width: 100, m: 2 }}
              component="video"
              title="preview"
              image={src}
              autoPlay
              loop
              muted
            />
            <Grid>
              <CardMedia
                sx={{ height: 200, width: 100, m: 2, objectFit: 'contain' }}
                component="img"
                title="preview image"
                image={previewImageWithPercentage}
              />
              <input
                {...getInputProps(previewPositionPercentage, {
                  type: 'hidden',
                })}
                key={previewPositionPercentage.key}
                value={previewPosition}
                max={100}
                min={0}
              />
              <TextField
                label="Preview image position in %"
                sx={{ flex: 1, width: 200, m: 1 }}
                defaultValue={previewPositionPercentage.initialValue}
                type="number"
                key="previewPosition"
                onChangeCapture={debouncedPreviewChange}
              />
            </Grid>
          </Grid>
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
