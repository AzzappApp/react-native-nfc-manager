import {
  getInputProps,
  getSelectProps,
  useInputControl,
  type FieldMetadata,
} from '@conform-to/react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { Fragment, useState, type ChangeEvent } from 'react';
import { FILTERS } from '@azzapp/shared/filtersHelper';
import { getCloudinaryAssetURL } from '@azzapp/shared/imagesHelpers';
import LottiePlayer from '#components/LottiePlayer';
import type { MediasSchemaType } from './coverTemplateSchema';

type Props = {
  lottieField: FieldMetadata<File | undefined>;
  mediaFields: FieldMetadata<MediasSchemaType[]>;
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

const LottieInput = ({ lottieField, mediaFields, lottieIdField }: Props) => {
  const lottieInput = useInputControl(lottieField as any);
  const [src, setSrc] = useState<any>(
    lottieIdField.initialValue
      ? getCloudinaryAssetURL(lottieIdField.initialValue, 'raw')
      : '',
  );
  const [data, setData] = useState<LottieData>();
  const [error, setError] = useState('');

  const onLoadFile = (event: ChangeEvent<any>) => {
    if (event.target.files[0]) {
      setError('');
      setSrc(undefined);
      setData(undefined);
      const file = event.target.files[0];

      const reader = new FileReader();
      reader.onload = (event: any) => {
        const lottieString = event.target.result;
        const lottieData = JSON.parse(lottieString);
        if (checkLottieJson(lottieData)) {
          setData(lottieData);
          lottieInput.change(file);
          const src = URL.createObjectURL(file);
          setSrc(src);
        } else {
          setError('Error on loading lottie json, please check file');
        }
      };

      reader.readAsText(file);
    }
  };

  const media =
    data?.assets
      .filter(({ e }) => e === 0)
      .map(({ id }) => ({
        id,
        filter: null,
      })) ||
    mediaFields.getFieldList().map(media => ({
      id: media.getFieldset().id.value,
      filter: media.getFieldset().filter.value,
    })) ||
    [];

  return (
    <Box>
      {src && (
        <Box height={200} width={100}>
          <LottiePlayer src={src} autoplay loop />
        </Box>
      )}
      <Box display="flex" gap={2} sx={{ mb: 2 }} flexWrap="wrap">
        {media.map(({ id, filter }, index) => (
          <Fragment key={id}>
            <input
              {...getInputProps(mediaFields, { type: 'hidden' })}
              key={`media-${id}`}
              name={`${mediaFields.name}[${index}].id`}
              value={id}
            />
            <FormControl fullWidth sx={{ width: 300 }}>
              <InputLabel id={`filter-label-${id}`}>
                Filter media {id}
              </InputLabel>
              <Select
                {...getSelectProps(mediaFields)}
                labelId={`filter-label-${id}`}
                label={`Filter media ${id}`}
                name={`${mediaFields.name}[${index}].filter`}
                defaultValue={filter}
              >
                <MenuItem value="">
                  <em>No filter</em>
                </MenuItem>
                {FILTERS.map(filter => (
                  <MenuItem key={filter} value={filter}>
                    <Typography>{filter}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Fragment>
        ))}
      </Box>

      {lottieIdField.initialValue && !data && (
        <input
          {...getInputProps(lottieIdField, { type: 'hidden' })}
          key={lottieIdField.key}
        />
      )}
      <input
        {...getInputProps(lottieField, { type: 'file' })}
        key={lottieField.key}
        accept={'.json'}
        style={{
          display: 'none',
        }}
        onChange={onLoadFile}
      />
      {error && (
        <Typography sx={{ mb: 2 }} variant="body1" color="error">
          {error}
        </Typography>
      )}
      {(lottieField.errors || lottieIdField.errors) && (
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
