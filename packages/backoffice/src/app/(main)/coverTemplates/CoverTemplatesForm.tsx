// @TODO: temporary disable for feat_cover_v2
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
// @ts-nocheck
'use client';

import { StarsSharp } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Dialog,
  DialogContent,
  Snackbar,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { capitalize, omit, pick } from 'lodash';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
// import { TEXT_POSITIONS } from '@azzapp/shared/coverHelpers';
import { uploadMedia } from '@azzapp/shared/WebAPI';
import { getSignedUpload } from '#app/mediaActions';
import FontSelect from '#components/FontSelect';
import MediaInput from '#components/MediaInput';
import StaticMediaSelectionList from '#components/StaticMediaSelectionList';
import { intParser, useForm } from '#helpers/formHelpers';
import { getCoverData, saveCoverTemplate } from './coverTemplatesActions';
import type {
  CoverTemplateErrors,
  CoverTemplateFormValue,
} from './coverTemplateSchema';
import type {
  ColorPalette,
  CoverTemplate,
  Media,
  StaticMedia,
} from '@azzapp/data';

type CoverTemplateFormProps = {
  coverTemplate?: CoverTemplate | null;
  previewMedia?: Media;
  coverBackgrounds: StaticMedia[];
  coverForegrounds: StaticMedia[];
  colorPalettes: ColorPalette[];
  saved?: boolean;
};

const CoverTemplateForm = ({
  coverTemplate,
  previewMedia,
  coverBackgrounds,
  coverForegrounds,
  colorPalettes,
  saved = false,
}: CoverTemplateFormProps) => {
  const isCreation = !coverTemplate;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<CoverTemplateErrors | null>(
    null,
  );

  type Data = Omit<CoverTemplateFormValue, 'previewMedia'> & {
    previewMedia: CoverTemplateFormValue['previewMedia'] | File;
  };
  const { data, setData, fieldProps } = useForm<Data>(
    () => {
      if (coverTemplate) {
        return {
          name: coverTemplate.name,
          kind: coverTemplate.kind,
          previewMedia: pick(previewMedia!, 'id', 'kind'),
          colorPaletteId: coverTemplate.colorPaletteId,
          businessEnabled: coverTemplate.businessEnabled,
          personalEnabled: coverTemplate.personalEnabled,

          titleFontSize: coverTemplate.data.titleStyle?.fontSize,
          titleFontFamily: coverTemplate.data.titleStyle?.fontFamily,
          titleColor: coverTemplate.data.titleStyle?.color,
          subTitleFontSize: coverTemplate.data.subTitleStyle?.fontSize,
          subTitleFontFamily: coverTemplate.data.subTitleStyle?.fontFamily,
          subTitleColor: coverTemplate.data.subTitleStyle?.color,
          textOrientation: coverTemplate.data.textOrientation,
          textAnimation: coverTemplate.data.textAnimation,
          textPosition: coverTemplate.data.textPosition,
          backgroundId: coverTemplate.data.backgroundId,
          backgroundColor: coverTemplate.data.backgroundColor,
          backgroundPatternColor: coverTemplate.data.backgroundPatternColor,
          foregroundId: coverTemplate.data.foregroundId,
          foregroundColor: coverTemplate.data.foregroundColor,
          mediaFilter: coverTemplate.data.mediaFilter,
          mediaParameters: coverTemplate.data.mediaParameters,
          mediaAnimation: coverTemplate.data.mediaAnimation,
        };
      }
      return { businessEnabled: true, personalEnabled: true };
    },
    formErrors?.fieldErrors,
    [coverTemplate, previewMedia],
  );

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    let media: { id: string; kind: 'image' | 'video' };
    if (data.previewMedia instanceof File) {
      const file = data.previewMedia;
      setUploading(true);
      const kind = file.type.startsWith('image') ? 'image' : 'video';
      let public_id: string;
      try {
        const { uploadURL, uploadParameters } = await getSignedUpload(
          kind,
          'cover',
        );
        ({ public_id } = await uploadMedia(file, uploadURL, uploadParameters)
          .promise);
        setUploading(false);
      } catch (error) {
        setError(error);
        setIsSaving(false);
        setUploading(false);
        return;
      }

      media = {
        id: public_id,
        kind,
      };
    } else {
      media = data.previewMedia!;
    }

    try {
      const result = await saveCoverTemplate({
        id: coverTemplate?.id,
        ...data,
        previewMedia: media,
      } as any);

      if (result.success) {
        setFormErrors(null);
        if (isCreation) {
          router.replace(
            `/coverTemplates/${result.coverTemplateId}?saved=true`,
          );
        } else {
          setDisplaySaveSuccess(true);
        }
      } else {
        setFormErrors(result.formErrors);
      }
    } catch (error) {
      setFormErrors(null);
      setError(error);
    }
    setIsSaving(false);
  };

  const [userName, setUserName] = useState('');
  const [loadCoverError, setLoadCoverError] = useState('');

  const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };

  const loadDataFromCover = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const data = await getCoverData(userName);
      setData({
        ...data,
        businessEnabled: true,
        personalEnabled: true,
      });
    } catch (error) {
      setLoadCoverError('Cover not found');
      return;
    }
  };

  const kindProps = fieldProps('kind');
  const colorPaletteIdProps = fieldProps('colorPaletteId');
  const textOrientationProps = fieldProps('textOrientation');
  const textAnimationProps = fieldProps('textAnimation', {
    // filter empty string to null
    parse: value => (value ? value : null),
  });
  const mediaAnimationProps = fieldProps('mediaAnimation', {
    // filter empty string to null
    parse: value => (value ? value : null),
  });
  const textPositionProps = fieldProps('textPosition');

  return (
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/cardTemplates"
        >
          <StarsSharp sx={{ mr: 0.5 }} fontSize="inherit" />
          Cover templates
        </Link>
      </Breadcrumbs>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {coverTemplate
          ? `CoverTemplate : ${coverTemplate.name}`
          : 'New CoverTemplate'}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
          padding: 2,
        }}
        maxWidth={600}
        component="form"
        onSubmit={loadDataFromCover}
      >
        <Typography variant="body1" component="h6">
          Load data from cover
        </Typography>
        <TextField
          name="userName"
          label="Cover User Name"
          disabled={saving}
          onChange={handleUserNameChange}
        />

        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={saving}
        >
          Load
        </Button>
        {loadCoverError && (
          <Typography variant="body1" color="error">
            Something went wrong {error?.message}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
          padding: 2,
        }}
        maxWidth={700}
        component="form"
        onSubmit={handleSubmit}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                name="businessEnabled"
                checked={!!data.businessEnabled}
                disabled={saving}
                {...omit(
                  fieldProps('businessEnabled', {
                    format: value => value ?? null,
                  }),
                  'error',
                  'helperText',
                )}
              />
            }
            label="Business Enabled"
          />
          <FormControlLabel
            control={
              <Switch
                name="personalEnabled"
                checked={!!data.personalEnabled}
                disabled={saving}
                {...omit(
                  fieldProps('personalEnabled', {
                    format: value => value ?? null,
                  }),
                  'error',
                  'helperText',
                )}
              />
            }
            label="Personal Enabled"
          />
        </Box>
        <Typography variant="body1">Informations</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            name="name"
            label="Name"
            disabled={saving}
            required
            sx={{ width: 300 }}
            {...fieldProps('name')}
          />

          <FormControl fullWidth error={kindProps.error} sx={{ width: 300 }}>
            <InputLabel id="kind-label">Profile Kind</InputLabel>
            <Select
              labelId={'kind-label'}
              id="kind"
              name="kind"
              value={kindProps.value}
              label="Template Kind"
              onChange={kindProps.onChange as any}
            >
              <MenuItem value="people">People</MenuItem>
              <MenuItem value="video">Video</MenuItem>
              <MenuItem value="others">Others</MenuItem>
            </Select>
            <FormHelperText>{kindProps.helperText}</FormHelperText>
          </FormControl>
        </Box>

        <Typography variant="body1">Media</Typography>

        <MediaInput
          label="Lottie"
          name="previewMedia"
          kind={kindProps.value === 'video' ? 'video' : 'image'}
          buttonLabel="Add lottie"
          {...fieldProps('previewMedia')}
        />

        <StaticMediaSelectionList
          label="Background"
          staticMedias={coverBackgrounds}
          {...fieldProps('backgroundId')}
        />

        <StaticMediaSelectionList
          label="Foreground"
          staticMedias={coverForegrounds}
          {...fieldProps('foregroundId')}
        />

        <Typography variant="body1">Styles</Typography>

        <Box display="flex" flexWrap="wrap" gap={2}>
          <TextField
            name="backgroundColor"
            label="Background Color"
            disabled={saving}
            sx={{ width: 300 }}
            {...fieldProps('backgroundColor')}
          />

          <TextField
            name="backgroundPatternColor"
            label="Pattern Color"
            disabled={saving}
            sx={{ width: 300 }}
            {...fieldProps('backgroundPatternColor')}
          />
          <TextField
            name="foregroundColor"
            label="Foreground Color"
            disabled={saving}
            sx={{ width: 300 }}
            {...fieldProps('foregroundColor')}
          />

          <FormControl
            fullWidth
            error={colorPaletteIdProps.error}
            sx={{ width: 300 }}
          >
            <InputLabel id="colorPalette-label">Color Palette</InputLabel>
            <Select
              labelId={'colorPalette-label'}
              id="colorPalette"
              name="kicolorPalettend"
              value={colorPaletteIdProps.value}
              label="Color Palette"
              onChange={colorPaletteIdProps.onChange as any}
            >
              {colorPalettes.map(colorPalette => (
                <MenuItem key={colorPalette.id} value={colorPalette.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: colorPalette.primary,
                      }}
                    />
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: colorPalette.light,
                      }}
                    />
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: colorPalette.dark,
                      }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{kindProps.helperText}</FormHelperText>
          </FormControl>

          <TextField
            name="filter"
            label="Filter"
            disabled={saving}
            sx={{ width: 300 }}
            {...fieldProps('mediaFilter')}
          />

          <FormControl
            fullWidth
            error={textAnimationProps.error}
            sx={{ width: 300 }}
          >
            <InputLabel id="textAnimation-label">Text Animation</InputLabel>
            <Select
              labelId={'textAnimation-label'}
              id="textAnimation"
              name="textAnimation"
              value={textAnimationProps.value}
              label="Text Animation"
              onChange={textAnimationProps.onChange as any}
            >
              <MenuItem value="">None</MenuItem>
              {textAnimations.map(animation => (
                <MenuItem key={animation} value={animation}>
                  {capitalize(animation)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{textAnimationProps.helperText}</FormHelperText>
          </FormControl>

          <FormControl
            fullWidth
            error={mediaAnimationProps.error}
            sx={{ width: 300 }}
          >
            <InputLabel id="mediaAnimation-label">Media Animation</InputLabel>
            <Select
              labelId={'mediaAnimation-label'}
              id="mediaAnimation"
              name="mediaAnimation"
              value={mediaAnimationProps.value}
              label="Media Animation"
              onChange={mediaAnimationProps.onChange as any}
            >
              <MenuItem value="">None</MenuItem>
              {mediaAnimations.map(animation => (
                <MenuItem key={animation} value={animation}>
                  {capitalize(animation)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{mediaAnimationProps.helperText}</FormHelperText>
          </FormControl>

          <FormControl
            fullWidth
            error={textOrientationProps.error}
            sx={{ width: 300 }}
          >
            <InputLabel id="textOrientation-label">Orientation</InputLabel>
            <Select
              labelId={'textOrientation-label'}
              id="textOrientation"
              name="textOrientation"
              value={textOrientationProps.value}
              label="Orientation"
              onChange={textOrientationProps.onChange as any}
            >
              <MenuItem value="horizontal">Horizontal</MenuItem>
              <MenuItem value="bottomToTop">Bottom To Top</MenuItem>
              <MenuItem value="topToBottom">Top to Bottom</MenuItem>
            </Select>
            <FormHelperText>{textOrientationProps.helperText}</FormHelperText>
          </FormControl>

          {/* <FormControl
            fullWidth
            error={textPositionProps.error}
            sx={{ width: 300 }}
          >
            <InputLabel id="textPosition-label">Placement</InputLabel>
            <Select
              labelId={'textPosition-label'}
              id="textPosition"
              name="textPosition"
              value={textPositionProps.value}
              label="Template Kind"
              onChange={textPositionProps.onChange as any}
            >
              {TEXT_POSITIONS.map(position => (
                <MenuItem key={position} value={position}>
                  {position}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{textPositionProps.helperText}</FormHelperText>
          </FormControl> */}

          <TextField
            name="titleColor"
            label="Title Color"
            disabled={saving}
            sx={{ width: 300 }}
            {...fieldProps('titleColor')}
          />

          <TextField
            name="titleFontSize"
            type="number"
            label="Title Font Size"
            disabled={saving}
            sx={{ width: 300 }}
            {...fieldProps('titleFontSize', { parse: intParser })}
          />

          <FontSelect
            name="titleFontFamily"
            label="Title Font Family"
            disabled={saving}
            sx={{ width: 300 }}
            {...fieldProps('titleFontFamily')}
          />

          <TextField
            name="subTitleColor"
            label="Sub Title Color"
            disabled={saving}
            sx={{ width: 300 }}
            {...fieldProps('subTitleColor')}
          />

          <TextField
            name="subTitleFontSize"
            type="number"
            label="Sub Title Font Size"
            disabled={saving}
            sx={{ width: 300 }}
            {...fieldProps('subTitleFontSize', { parse: intParser })}
          />

          <FontSelect
            name="subTitleFontFamily"
            label="Sub Title Font Family"
            disabled={saving}
            sx={{ width: 300 }}
            {...fieldProps('subTitleFontFamily')}
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={saving}
        >
          Save
        </Button>
        {error && (
          <Typography variant="body1" color="error">
            Something went wrong {error?.message}
          </Typography>
        )}
      </Box>
      <Dialog open={uploading}>
        <DialogContent>Uploading ...</DialogContent>
      </Dialog>
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => setDisplaySaveSuccess(false)}
        autoHideDuration={6000}
        message="CoverTemplate saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default CoverTemplateForm;

const textAnimations = [
  'slideUp',
  'slideRight',
  'slideBottom',
  'slideLeft',
  'smoothUp',
  'smoothRight',
  'smoothBottom',
  'smoothLeft',
  'smoothLettersUp',
  'smoothLettersBottom',
  'slideLettersUp',
  'slideLettersRight',
  'slideLettersBottom',
  'slideLettersLeft',
  'fadeIn',
  'fadeInByLetter',
  'appear',
  'appearByLetter',
  'bounce',
  'neon',
];

const mediaAnimations = [
  'smoothZoomOut',
  'linearZoomOut',
  'appearZoomOut',
  'smoothZoomIn',
  'linearZoomIn',
  'appearZoomIn',
  'fadeInOut',
  'pop',
  'rotate',
];
