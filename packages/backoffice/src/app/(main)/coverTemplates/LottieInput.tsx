import {
  getInputProps,
  useInputControl,
  type FieldMetadata,
} from '@conform-to/react';
import { Box, Button, Typography } from '@mui/material';
import { useRef, useState, type ChangeEvent } from 'react';
import { getCloudinaryAssetURL } from '@azzapp/shared/imagesHelpers';
import LottiePlayer from '#components/LottiePlayer';

type Props = {
  lottieField: FieldMetadata<File | undefined>;
  mediaCountField: FieldMetadata<number>;
  lottieIdField: FieldMetadata<string>;
};

type LottieData = {
  assets: Array<{
    id: string;
    h: number;
    w: number;
    e: 0 | 1;
  }>;
};

const checkLottieJson = (lottie: any) => !!lottie.layers && !!lottie.assets;

const LottieInput = ({
  lottieField,
  mediaCountField,
  lottieIdField,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const lottieInput = useInputControl(lottieField as any);
  const lottieIdInput = useInputControl(lottieIdField as any);
  const mediaCountInput = useInputControl(mediaCountField as any);
  const [src, setSrc] = useState<any>(
    lottieIdField.initialValue
      ? getCloudinaryAssetURL(lottieIdField.initialValue, 'raw')
      : '',
  );
  const [count, setCount] = useState<number>(
    parseInt(mediaCountField.initialValue || '0', 10) || 0,
  );
  const [error, setError] = useState('');

  const onLoadFile = (event: ChangeEvent<any>) => {
    if (event.target.files[0]) {
      setError('');
      setSrc(undefined);
      setCount(0);
      lottieIdInput.change(undefined);
      const file = event.target.files[0];

      const reader = new FileReader();
      reader.onload = (event: any) => {
        const lottieString = event.target.result;
        const lottieData: LottieData = JSON.parse(lottieString);
        if (checkLottieJson(lottieData)) {
          const count =
            lottieData?.assets
              .filter(({ e }) => e === 0)
              .map(({ id }) => ({
                id,
                filter: null,
              })).length || 0;
          setCount(count);
          lottieInput.change(file);
          mediaCountInput.change(`${count}`);
          const src = URL.createObjectURL(file);
          setSrc(src);
        } else {
          setError('Error on loading lottie json, please check file');
        }
      };

      reader.readAsText(file);
    }
  };

  return (
    <Box>
      {src && (
        <Box height={200} width={100}>
          <LottiePlayer src={src} autoplay loop />
        </Box>
      )}
      <Box display="flex" gap={2} sx={{ mb: 2 }} flexWrap="wrap">
        <input
          {...getInputProps(mediaCountField, { type: 'hidden' })}
          key={mediaCountField.key}
        />
        {src && <Typography>Media count : {count}</Typography>}
      </Box>

      {lottieIdField.value && (
        <input
          {...getInputProps(lottieIdField, { type: 'hidden' })}
          key={lottieIdField.key}
        />
      )}
      <input
        ref={inputRef}
        {...getInputProps(lottieField, { type: 'file' })}
        key={lottieField.key}
        accept=".json"
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
      {error && (
        <Typography sx={{ mb: 2 }} variant="body1" color="error">
          {error}
        </Typography>
      )}
      {(mediaCountField.errors ||
        lottieField.errors ||
        lottieIdField.errors) && (
        <Typography sx={{ mb: 2 }} variant="body1" color="error">
          Lottie is required
        </Typography>
      )}
      <Box display="flex" alignItems="center">
        <Button variant="contained" type="button">
          <Typography
            variant="button"
            component="label"
            htmlFor={lottieField.id}
          >
            LOAD LOTTIE
          </Typography>
        </Button>
      </Box>
    </Box>
  );
};

export default LottieInput;
