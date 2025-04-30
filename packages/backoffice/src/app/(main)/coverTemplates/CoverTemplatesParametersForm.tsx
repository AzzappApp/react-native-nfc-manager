'use client';

import {
  getInputProps,
  getSelectProps,
  useForm,
  useInputControl,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
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
  Checkbox,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useActionState,
} from 'react';
import MediaInput from '#components/MediaInput';
import { uploadMedia } from '#helpers/mediaHelper';
import CoverOverlayForm from './CoverOverlayForm';
import { saveCoverTemplate } from './coverTemplatesActions';
import { coverTemplateSchema } from './coverTemplateSchema';
import CoverTextForm from './CoverTextForm';
import LottieInput from './LottieInput';
import PreviewInput from './PreviewInput';
import SocialLinksForm from './SocialLinksForm';
import type { CoverTemplateFormValue } from './coverTemplateSchema';
import type {
  ColorPalette,
  CoverTemplate,
  CoverTemplateParams,
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

const CoverTemplatesParametersForm = ({
  coverTemplate,
  colorPalettes,
  coverTemplateTypes,
  coverTemplateTags,
  saved = false,
}: CoverTemplateFormProps) => {
  const router = useRouter();
  const loadConfInputRef = useRef<HTMLInputElement>(null);
  const [saving, setIsSaving] = useState(false);
  const [displaySaveSuccess, setDisplaySaveSuccess] = useState(saved);
  const [error, setError] = useState<string>();
  const [tags, setTags] = useState<string[]>([...(coverTemplate?.tags || [])]);
  const [lastResult, action] = useActionState(saveCoverTemplate, undefined);
  const [enabled, setEnabled] = useState(
    coverTemplate ? coverTemplate.enabled : true,
  );
  const [uploading, setUploading] = useState(false);

  const [form, fields] = useForm<CoverTemplateFormValue>({
    defaultValue: {
      id: coverTemplate?.id,
      name: coverTemplate?.name || '',
      previewId: coverTemplate?.previewId || '',
      lottieId: coverTemplate?.lottieId || '',
      mediaCount: coverTemplate?.mediaCount,
      medias: coverTemplate?.medias,
      order: coverTemplate?.order || 0,
      colorPaletteId: coverTemplate?.colorPaletteId || colorPalettes[0]?.id,
      typeId: coverTemplate?.typeId || coverTemplateTypes[0]?.id,
      tags: coverTemplate?.tags || [],
      enabled: coverTemplate ? `${coverTemplate.enabled}` : 'true',
      params: coverTemplate?.params || {
        linksLayer: {
          color: 'light',
          position: {
            x: '50',
            y: '50',
          },
          size: '24',
        },
      },
      backgroundColor: coverTemplate?.backgroundColor ?? null,
      previewPositionPercentage: coverTemplate?.previewPositionPercentage,
    },
    lastResult,
    onSubmit() {
      setIsSaving(true);
    },
    onValidate({ formData }) {
      const valid = parseWithZod(formData, { schema: coverTemplateSchema });
      return valid;
    },
    shouldValidate: 'onSubmit',
    shouldRevalidate: 'onSubmit',
  });

  const [medias, setMedias] = useState<
    Array<{ id: File | string; editable: boolean; index: number }>
  >(coverTemplate?.medias ?? []);

  const onMediaChange = async (media: {
    id: File | string | null | undefined;
    editable: boolean;
    index: number;
  }) => {
    if (media.id instanceof File) {
      setUploading(true);
      try {
        const { public_id } = await uploadMedia(
          media.id,
          media.id.type.startsWith('image') ? 'image' : 'video',
        );

        media.id = public_id;
        setUploading(false);
      } catch (e) {
        setUploading(false);
        throw e;
      }
    }

    setMedias(prevMedias => {
      const previousMediaIndex = prevMedias.findIndex(
        prevMedia => prevMedia.index === media.index,
      );

      if (previousMediaIndex >= 0) {
        const nextMedias = [...prevMedias];

        if (media.id) {
          nextMedias[previousMediaIndex].id = media.id;
          nextMedias[previousMediaIndex].editable = media.editable;
        } else {
          nextMedias.splice(previousMediaIndex, 1);
        }

        return nextMedias;
      } else if (media.id) {
        return [
          ...prevMedias,
          {
            id: media.id,
            index: media.index,
            editable: media.editable,
          },
        ];
      }

      return prevMedias;
    });
  };

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

  const handleAction = useCallback(
    async (formData: FormData) => {
      try {
        const previewFile = formData.get('preview') as File;
        if (previewFile?.size > 0) {
          const { public_id } = await uploadMedia(previewFile, 'video');
          formData.set(`previewId`, public_id);
        }
        formData.delete('preview');

        const lottieField = formData.get('lottie') as File;
        if (lottieField?.size > 0) {
          const { public_id } = await uploadMedia(lottieField, 'raw');
          formData.set(`lottieId`, public_id);
        }
        formData.delete('lottie');

        const uploadedMedias = await Promise.all(
          medias.map(async media => {
            if (media.id instanceof File) {
              const { public_id } = await uploadMedia(
                media.id,
                media.id.type.startsWith('image') ? 'image' : 'video',
              );
              return {
                ...media,
                id: public_id,
              };
            } else {
              return media;
            }
          }),
        );

        formData.set('medias', JSON.stringify(uploadedMedias));

        action(formData);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    },
    [action, medias],
  );

  useEffect(() => {
    if (lastResult?.status === 'success') {
      setDisplaySaveSuccess(true);
    } else if (lastResult?.status === 'error') {
      setError('Something went wrong');
    }

    if (lastResult?.coverTemplateId) {
      router.push(lastResult.coverTemplateId);
    }
  }, [lastResult, router]);

  useEffect(() => {
    const input = loadConfInputRef.current;

    const handleFileAsync = async (e: any) => {
      try {
        const file: File = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const data: CoverTemplateParams = JSON.parse(e.target.result);
          if (!data.linksLayer && !data.overlayLayers && !data.textLayers) {
            setError('Bad file format');
          } else {
            form.update({
              name: fields.params.name,
              value: {
                ...data,
                linksLayer: {
                  ...data.linksLayer,
                  links: data.linksLayer.links.filter(link => !link),
                },
                textLayers: data.textLayers.map(layer => ({
                  ...layer,
                  text: 'custom',
                  customText: layer.text,
                })),
              },
            });
          }
        };
        reader.readAsText(file);
        if (loadConfInputRef.current) {
          loadConfInputRef.current.value = '';
        }
      } catch (e) {
        console.error(e);
        setError('Something went wrong');
      }
    };

    if (input) {
      input.addEventListener('change', handleFileAsync, false);
    }
    return () => {
      if (input) {
        input.removeEventListener('change', handleFileAsync, false);
      }
    };
  }, [fields.params.name, form]);

  const onSelectFile = () => {
    loadConfInputRef.current?.click();
  };

  return (
    <>
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
        action={handleAction}
      >
        <input
          {...getInputProps(fields.id, { type: 'hidden' })}
          key={fields.id.key}
        />
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
            key={fields.name.key}
          />

          <FormControl
            fullWidth
            required
            error={!!fields.typeId.errors}
            sx={{ flex: 1 }}
          >
            <InputLabel id="coverTemplateType-label">
              Cover template type
            </InputLabel>
            <Select
              labelId="coverTemplateType-label"
              label="Cover template type"
              {...getSelectProps(fields.typeId)}
              key={fields.typeId.key}
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
            error={!!fields.backgroundColor.errors}
            sx={{ flex: 1 }}
          >
            <InputLabel id="coverTemplateBackground-label">
              Background
            </InputLabel>
            <Select
              labelId="coverTemplateBackground-label"
              label="Background"
              {...getSelectProps(fields.backgroundColor)}
              key={fields.backgroundColor.key}
            >
              {coverTemplateBackgrounds.map(coverTemplateBackground => (
                <MenuItem
                  key={coverTemplateBackground.id}
                  value={coverTemplateBackground.id}
                >
                  <Typography>{coverTemplateBackground.label}</Typography>
                </MenuItem>
              ))}
              <MenuItem value={undefined}>
                <Typography>None</Typography>
              </MenuItem>
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
              labelId="order-label"
              label="Cover template type"
              {...getSelectProps(fields.order)}
              key={fields.order.key}
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
              labelId="colorPalette-label"
              label="Color Palette"
              {...getSelectProps(fields.colorPaletteId)}
              key={fields.colorPaletteId.key}
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

        <Typography variant="body1">
          Load cover template configuration file
        </Typography>

        <input
          ref={loadConfInputRef}
          type="file"
          accept="application/json"
          style={{
            visibility: 'hidden',
            display: 'none',
          }}
        />

        <Button variant="contained" sx={{ mt: 2 }} onClick={onSelectFile}>
          Load config file
        </Button>

        <Typography variant="body1">Preview</Typography>

        <PreviewInput
          previewField={fields.preview}
          previewIdField={fields.previewId}
          previewPositionPercentage={fields.previewPositionPercentage}
        />

        <Typography variant="body1">Lottie</Typography>

        <LottieInput
          lottieField={fields.lottie}
          mediaCountField={fields.mediaCount}
          lottieIdField={fields.lottieId}
        />

        <Box width="100%" display="flex" flexDirection="row" gap="20px">
          {Array.from({
            length: parseInt(fields.mediaCount.value ?? '0', 10),
          }).map((_, index) => {
            const media = medias.find(media => media.index === index);
            const value =
              typeof media?.id === 'string'
                ? {
                    id: media.id,
                    kind: media.id.startsWith('v_')
                      ? ('video' as const)
                      : ('image' as const),
                  }
                : (media?.id ?? null);

            return (
              <Box key={index} display="flex" flexDirection="column">
                <MediaInput
                  buttonLabel="UPLOAD A MEDIA"
                  buttonStyle={{
                    paddingLeft: 0,
                    paddingRight: 0,
                    width: 150,
                  }}
                  label={`Media #${index}`}
                  name={`media-${index}`}
                  kind="mixed"
                  onChange={file => {
                    onMediaChange({
                      id: file,
                      index,
                      editable: media?.editable ?? true,
                    });
                  }}
                  value={value}
                  style={{
                    maxWidth: 150,
                    width: 150,
                    height: 150,
                    borderRadius: 18,
                    border: '2px solid rgba(245, 245, 246, 1)',
                  }}
                />
                <FormControlLabel
                  key={`media-${index}`}
                  control={
                    <Checkbox
                      value={`media-${index}-non-editable`}
                      name={`media-${index}-non-editable`}
                      checked={media?.editable === false}
                      onChange={(_, checked) => {
                        if (media) {
                          onMediaChange({
                            ...media,
                            editable: !checked,
                          });
                        }
                      }}
                    />
                  }
                  label="Non-editable"
                />
              </Box>
            );
          })}
        </Box>

        <Box width="100%">
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
        open={!!error}
        onClose={() => {
          setError(undefined);
        }}
        autoHideDuration={6000}
        message={error}
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
      <Backdrop
        sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
        open={saving}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {uploading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={10000}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <CircularProgress color="inherit" />
        </Box>
      )}
    </>
  );
};

const coverTemplateBackgrounds = [
  {
    id: 'primary',
    label: 'Primary',
  },
  {
    id: 'light',
    label: 'Light',
  },
  {
    id: 'dark',
    label: 'Dark',
  },
];

export default CoverTemplatesParametersForm;
