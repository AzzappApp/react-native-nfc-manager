'use client';

import {
  getInputProps,
  getSelectProps,
  useForm,
  useInputControl,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { StarsSharp } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Snackbar,
  Breadcrumbs,
  Link,
  Checkbox,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import CoverOverlayForm from './CoverOverlayForm';
import { saveCoverTemplate } from './coverTemplatesActions';
import { coverTemplateSchema } from './coverTemplateSchema';
import CoverTextForm from './CoverTextForm';
import LottieInput from './LottieInput';
import SocialLinksForm from './SocialLinksForm';
import type { CoverTemplateFormValue } from './coverTemplateSchema';
import type {
  ColorPalette,
  CoverTemplate,
  CoverTemplateTag,
  CoverTemplateType,
} from '@azzapp/data';
import type { ChangeEvent } from 'react';

type CoverTemplateFormProps = {
  coverTemplate?: CoverTemplate;
  coverTemplateTags: Array<CoverTemplateTag & { label: string }>;
  colorPalettes: ColorPalette[];
  coverTemplateTypes: Array<CoverTemplateType & { label: string }>;
  saved?: boolean;
};

const CoverTemplateForm = ({
  coverTemplate,
  colorPalettes,
  coverTemplateTypes,
  coverTemplateTags,
  saved = false,
}: CoverTemplateFormProps) => {
  const router = useRouter();
  const schema = coverTemplateSchema;
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<any>(null);
  const [tags, setTags] = useState<string[]>([...(coverTemplate?.tags || [])]);
  const [lastResult, action] = useFormState(saveCoverTemplate, undefined);
  const [enabled, setEnabled] = useState(
    coverTemplate ? coverTemplate.enabled : true,
  );

  const [form, fields] = useForm<CoverTemplateFormValue>({
    defaultValue: {
      id: coverTemplate?.id,
      name: coverTemplate?.name || '',
      lottieId: coverTemplate?.lottieId || '',
      order: coverTemplate?.order || 0,
      colorPaletteId: coverTemplate?.colorPaletteId || colorPalettes[0]?.id,
      type: coverTemplate?.type || coverTemplateTypes[0]?.id,
      tags: coverTemplate?.tags || [],
      enabled: coverTemplate ? `${coverTemplate.enabled}` : 'true',
      params: coverTemplate?.params || {
        linksLayer: {
          color: 'light',
        },
      },
    },
    lastResult,
    onValidate({ formData }) {
      const valid = parseWithZod(formData, { schema });
      console.log(valid);
      return valid;
    },
    shouldValidate: 'onSubmit',
    shouldRevalidate: 'onSubmit',
  });

  const enabledField = useInputControl(fields.enabled);

  const toggleEnabled = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setEnabled(event.target.checked);
      enabledField.change(`${event.target.checked}`);
    },
    [enabledField],
  );

  const toggleTag = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const tag = event.target.value;
      if (tags.indexOf(tag) >= 0) {
        const n = tags.filter(t => t !== tag);
        setTags(n);
      } else {
        setTags([...tags, tag]);
      }
    },
    [tags],
  );

  useEffect(() => {
    setIsSaving(true);
    if (lastResult?.status === 'success') {
      setDisplaySaveSuccess(true);
    } else if (lastResult?.status === 'error') {
      setError(true);
    }

    if (lastResult?.coverTemplateId) {
      router.push(lastResult.coverTemplateId);
    }
    setIsSaving(false);
  }, [lastResult, router]);

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
        minWidth={800}
        width="100%"
        component="form"
        flexWrap="wrap"
        id={form.id}
        onSubmit={form.onSubmit}
        action={action}
      >
        <input {...getInputProps(fields.id, { type: 'hidden' })} />
        {tags.map((tag, i) => (
          <input
            {...getInputProps(fields.tags, { type: 'hidden' })}
            key={tag}
            name={`${fields.tags.name}[${i}]`}
            value={tag}
          />
        ))}

        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <FormControlLabel
            control={
              <Switch
                disabled={saving}
                checked={enabled}
                onChange={toggleEnabled}
              />
            }
            label="Enabled"
          />
        </Box>

        <Typography variant="body1">Informations</Typography>
        <Box display="flex" alignItems="center" gap={2} width="100%">
          <TextField
            label="Label"
            disabled={saving}
            sx={{ flex: 1 }}
            required
            error={!!fields.name.errors}
            {...getInputProps(fields.name, { type: 'text' })}
          />

          <FormControl
            fullWidth
            required
            error={!!fields.type.errors}
            sx={{ flex: 1 }}
          >
            <InputLabel id="coverTemplateType-label">
              Cover template type
            </InputLabel>
            <Select
              labelId={'coverTemplateType-label'}
              label="Cover template type"
              {...getSelectProps(fields.type)}
            >
              {coverTemplateTypes.map(coverTemplateType => (
                <MenuItem
                  key={coverTemplateType.id}
                  value={coverTemplateType.id}
                >
                  <Typography>{coverTemplateType.label}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            required
            error={!!fields.order.errors}
            sx={{ flex: 1 }}
          >
            <InputLabel id="order-label">Order</InputLabel>
            <Select
              labelId={'order-label'}
              label="Cover template type"
              {...getSelectProps(fields.order)}
            >
              {[...Array(11).keys()].map(order => (
                <MenuItem key={order} value={order}>
                  <Typography>{order}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            error={!!fields.colorPaletteId.errors}
            required
            sx={{ flex: 1 }}
          >
            <InputLabel id="colorPalette-label">Color Palette</InputLabel>
            <Select
              labelId={'colorPalette-label'}
              label="Color Palette"
              {...getSelectProps(fields.colorPaletteId)}
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
          </FormControl>
        </Box>

        <Typography variant="body1">Lottie</Typography>

        <LottieInput
          lottieField={fields.lottie}
          mediaFields={fields.params.getFieldset().medias}
          lottieIdField={fields.lottieId}
          lottieId={coverTemplate?.lottieId}
        />

        <Box>
          {fields.params
            .getFieldset()
            .textLayers.getFieldList()
            .map((text, i) => {
              return (
                <Box key={text.key}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography
                      variant="body1"
                      sx={{ mt: 2, mb: 2 }}
                      fontWeight={500}
                    >
                      {`Text ${i + 1}`}
                    </Typography>
                    <button
                      style={{
                        backgroundColor: 'white',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      {...form.remove.getButtonProps({
                        name: fields.params.getFieldset().textLayers.name,
                        index: i,
                      })}
                    >
                      <DeleteIcon />
                    </button>
                  </Box>
                  <CoverTextForm field={text} />
                </Box>
              );
            })}
          <Button
            type="submit"
            variant="contained"
            onKeyDown={e => {
              e.preventDefault();
            }}
            sx={{ mt: 2 }}
            {...form.insert.getButtonProps({
              name: fields.params.getFieldset().textLayers.name,
            })}
          >
            Add text
          </Button>
        </Box>
        <Box width="100%">
          {fields.params
            .getFieldset()
            .overlayLayers.getFieldList()
            .map((overlay, i) => {
              return (
                <Box key={overlay.key}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography
                      variant="body1"
                      sx={{ mt: 2, mb: 2 }}
                      fontWeight={500}
                    >
                      {`Overlay ${i + 1}`}
                    </Typography>
                    <button
                      style={{
                        backgroundColor: 'white',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      {...form.remove.getButtonProps({
                        name: fields.params.getFieldset().overlayLayers.name,
                        index: i,
                      })}
                    >
                      <DeleteIcon />
                    </button>
                  </Box>
                  <CoverOverlayForm field={overlay} />
                </Box>
              );
            })}
          <Button
            type="submit"
            onKeyDown={e => {
              e.preventDefault();
            }}
            variant="contained"
            sx={{ mt: 2 }}
            {...form.insert.getButtonProps({
              name: fields.params.getFieldset().overlayLayers.name,
            })}
          >
            Add overlay
          </Button>
        </Box>

        <SocialLinksForm
          form={form}
          field={fields.params.getFieldset().linksLayer}
        />

        <Box>
          <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
            Filters / Tags
          </Typography>
          {coverTemplateTags.map(({ id, label }) => (
            <FormControlLabel
              key={id}
              control={
                <Checkbox
                  value={id}
                  checked={tags.indexOf(id) >= 0}
                  onChange={toggleTag}
                />
              }
              label={label}
            />
          ))}
        </Box>

        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={saving}
        >
          Save
        </Button>
      </Box>
      <Snackbar
        open={error}
        onClose={() => {
          setError(undefined);
        }}
        autoHideDuration={6000}
        message={`Something went wrong`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      <Snackbar
        open={displaySaveSuccess}
        onClose={() => {
          setDisplaySaveSuccess(false);
        }}
        autoHideDuration={6000}
        message="CoverTemplate saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default CoverTemplateForm;

// const mediaAnimations = [
//   'smoothZoomOut',
//   'linearZoomOut',
//   'appearZoomOut',
//   'smoothZoomIn',
//   'linearZoomIn',
//   'appearZoomIn',
//   'fadeInOut',
//   'pop',
//   'rotate',
// ];
