import {
  TabbedForm,
  FormTab,
  BooleanInput,
  TextInput,
  required,
  ImageInput,
  ImageField,
  ReferenceInput,
  AutocompleteInput,
  NumberInput,
  SelectInput,
  RadioButtonGroupInput,
  ArrayInput,
  SimpleFormIterator,
  SaveButton,
  Toolbar,
} from 'react-admin';
import {
  DEFAULT_PALETTE_COLOR,
  DEFAULT_COVER_CONTENT_PLACEMENT,
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
  DEFAULT_COVER_MIN_FONT_SIZE,
  DEFAULT_COVER_MAX_FONT_SIZE,
} from '@azzapp/shared/cardHelpers';
import SectionTitle from '#components/SectionTitle';
import type { ValidateForm } from 'react-admin';

const CoverTemplate = ({
  validate,
}: {
  validate: ValidateForm | undefined;
}) => {
  return (
    <TabbedForm
      validate={validate}
      mode="onChange"
      reValidateMode="onChange"
      toolbar={
        <Toolbar>
          <SaveButton label="Save" />
        </Toolbar>
      }
      defaultValues={{
        enabled: true,
        colorPalette: DEFAULT_PALETTE_COLOR.join(','),
        kind: 'personal',
        data: {
          backgroundStyle: {
            backgroundColor: '#FFFFFF',
            patternColor: '#000000',
          },
          foregroundStyle: {
            color: '#000000',
          },
          contentStyle: {
            placement: DEFAULT_COVER_CONTENT_PLACEMENT,
            orientation: DEFAULT_COVER_CONTENT_ORTIENTATION,
          },
          titleStyle: {
            fontFamily: DEFAULT_COVER_FONT_FAMILY,
            fontSize: DEFAULT_COVER_FONT_SIZE,
            color: DEFAULT_COVER_TEXT_COLOR,
          },
          subTitleStyle: {
            fontFamily: DEFAULT_COVER_FONT_FAMILY,
            fontSize: DEFAULT_COVER_FONT_SIZE,
            color: DEFAULT_COVER_TEXT_COLOR,
          },
          mediaStyle: {
            parameters: {
              brightness: 0,
              contrast: 1,
              highlights: 1,
              saturation: 1,
              shadow: 0,
              sharpness: 0,
              structure: 0,
              temperature: 6500,
              tint: 0,
              vibrance: 0,
              vigneting: 0,
              roll: 0,
            },
          },
        },
      }}
    >
      <FormTab label="summary">
        <BooleanInput
          label="Enabled"
          source="enabled"
          helperText="Defined is the Cover Template is accessible to user"
        />
        <TextInput
          label="Name"
          source="name"
          validate={required()}
          helperText="A name for search purpose on Admin panel - Internal use only"
        />
        <RadioButtonGroupInput
          source="kind"
          label=""
          choices={[
            { id: 'personal', name: 'Personal' },
            { id: 'business', name: 'Business' },
            { id: 'product', name: 'Product' },
          ]}
        />
        <TextInput
          fullWidth
          label="Color Palette"
          source="colorPalette"
          helperText="Hex Color code separated by  comma. #123453,#87FAEE,#23CA23"
        />
        <SectionTitle label="Category" />
        <ArrayInput source="category" label="">
          <SimpleFormIterator inline disableReordering sx={{ marginLeft: 2 }}>
            <TextInput
              source="id"
              label="Country Code"
              helperText={'For category translation'}
            />
            <TextInput
              source="category"
              label="Category"
              helperText={false}
              sx={{ minWidth: 300 }}
            />
          </SimpleFormIterator>
        </ArrayInput>
        <TextInput source="tags" fullWidth />
      </FormTab>
      <FormTab label="Cover">
        <ImageInput
          source="data.sourceMediaId"
          label=""
          accept="image/*"
          helperText="No control is done on the width, height, ratio and format of the
          image. Please test the image before uploading it."
        >
          <ImageField
            source="src"
            title=""
            sx={{ backgroundColor: 'rgba(233,233,233,0.2)' }}
          />
        </ImageInput>
        <div style={{ display: 'flex' }}>
          <BooleanInput source="segmented" label="Segmented" />
          <BooleanInput source="merged" label="Merged" />
        </div>
        <SectionTitle label="Filter" />
        <SelectInput
          source="data.mediaStyle.filter"
          label="Filter"
          choices={FILTERS}
          fullWidth
        />
        <SectionTitle label="Background" />
        <ReferenceInput
          source="data.backgroundId"
          reference="CoverLayer"
          filter={{ kind: 'background', available: 1 }}
          perPage={25}
        >
          <AutocompleteInput
            source="id"
            fullWidth
            optionText="name"
            label="Select a background"
            helperText="Search based on the name of the Cover Layout - null means no name is defined"
            //  filterToQuery={filterToQuery}
          />
        </ReferenceInput>
        <div>
          <TextInput
            source="data.backgroundStyle.backgroundColor"
            label="Background Color"
            style={{ marginRight: 20 }}
          />
          <TextInput
            source="data.backgroundStyle.patternColor"
            label="Pattern Color"
            fullWidth
            helperText="Not available in preview for now"
          />
        </div>
        <SectionTitle label="Foreground" />
        <ReferenceInput
          source="data.foregroundId"
          reference="CoverLayer"
          filter={{ kind: 'foreground', available: 1 }}
          perPage={25}
        >
          <AutocompleteInput
            source="id"
            optionText="name"
            fullWidth
            label="Select a foreground"
            helperText="Search based on the name of the Cover Layout - null means no name is defined"
            //  filterToQuery={filterToQuery}
          />
        </ReferenceInput>
        <TextInput source="data.foregroundStyle.color" label="Color" />
      </FormTab>
      <FormTab label="Text">
        <SectionTitle label="Title" />
        <TextInput source="data.title" label="Title" fullWidth />
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-evenly',
            flexDirection: 'row',
          }}
        >
          <TextInput
            source="data.titleStyle.color"
            label="Color"
            variant="standard"
          />
          <NumberInput
            source="data.titleStyle.fontSize"
            label={`Font Size (min: ${DEFAULT_COVER_MIN_FONT_SIZE}, max: ${DEFAULT_COVER_MAX_FONT_SIZE})`}
            variant="standard"
            min={DEFAULT_COVER_MIN_FONT_SIZE}
            max={DEFAULT_COVER_MAX_FONT_SIZE}
          />
          <SelectInput
            source="data.titleStyle.fontFamily"
            label="Font Family"
            choices={FONTS}
            variant="standard"
          />
        </div>
        <SectionTitle label="Subtitle" />
        <TextInput source="data.subTitle" label="SubTitle" fullWidth />
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-evenly',
            flexDirection: 'row',
          }}
        >
          <TextInput
            source="data.subTitleStyle.color"
            label="Color"
            variant="standard"
          />
          <NumberInput
            source="data.subTitleStyle.fontSize"
            label={`Font Size (min: ${DEFAULT_COVER_MIN_FONT_SIZE}, max: ${DEFAULT_COVER_MAX_FONT_SIZE})`}
            variant="standard"
            min={DEFAULT_COVER_MIN_FONT_SIZE}
            max={DEFAULT_COVER_MAX_FONT_SIZE}
          />
          <SelectInput
            source="data.subTitleStyle.fontFamily"
            label="Font Family"
            choices={FONTS}
            variant="standard"
          />
        </div>

        <SectionTitle label="ContentStyle" />
        <RadioButtonGroupInput
          fullWidth
          source="data.contentStyle.orientation"
          choices={[
            { id: 'horizontal', name: 'Horizontal' },
            { id: 'topToBottom', name: 'Top To Bottom' },
            { id: 'bottomToTop', name: 'Bottom To Top' },
          ]}
        />
        <SelectInput
          fullWidth
          source="data.contentStyle.placement"
          choices={[
            { id: 'topLeft', name: 'Top Left' },
            { id: 'topCenter', name: 'Top Center' },
            { id: 'topRight', name: 'Top Right' },
            { id: 'middleLeft', name: 'Middle Left' },
            { id: 'middleCenter', name: 'Middle Center' },
            { id: 'middleRight', name: 'Middle Right' },
            { id: 'bottomLeft', name: 'Bottom Left' },
            { id: 'bottomCenter', name: 'Bottom Center' },
            { id: 'bottomRight', name: 'Bottom Right' },
          ]}
        />
      </FormTab>
      <FormTab label="Media Style">
        {Object.keys(MEDIA_STYLE).map(key => {
          return (
            <NumberInput
              fullWidth
              source={`data.mediaStyle.parameters.${key}`}
              label={key}
              key={key}
              max={MEDIA_STYLE[key].max}
              min={MEDIA_STYLE[key].min}
              step={MEDIA_STYLE[key].step}
            />
          );
        })}
      </FormTab>
    </TabbedForm>
  );
};

const MEDIA_STYLE: any = {
  brightness: {
    defaultValue: 0,
    min: -0.5,
    max: 0.5,
    step: 0.025,
    interval: 10,
  },
  contrast: { defaultValue: 1, min: 0.5, max: 1.5, step: 0.025, interval: 10 },
  highlights: { defaultValue: 1, min: 0, max: 1, step: 0.05, interval: 10 },
  saturation: { defaultValue: 1, min: 0, max: 2, step: 0.05, interval: 10 },
  shadow: { defaultValue: 0, min: 0, max: 1, step: 0.05, interval: 10 },
  sharpness: { defaultValue: 0, min: -2, max: 2, step: 0.05, interval: 10 },
  structure: { defaultValue: 0, min: -2, max: 2, step: 0.05, interval: 10 },
  temperature: {
    defaultValue: 6500,
    min: 3500,
    max: 12500,
    step: 50,
    interval: 10,
    displayOriginalValue: true,
  },
  tint: { defaultValue: 0, min: -150, max: 150, step: 5, interval: 10 },
  vibrance: { defaultValue: 0, min: -1, max: 1, step: 0.05, interval: 10 },
  vigneting: { defaultValue: 0, min: -2, max: 2, step: 0.05, interval: 10 },
  roll: {
    defaultValue: 0,
    min: -20,
    max: 20,
    step: 1,
    interval: 10,
    displayOriginalValue: true,
  },
};

export default CoverTemplate;

export const FONTS = [
  { id: 'Academy Engraved LET', name: 'Academy Engraved LET' },
  { id: 'Al Nile', name: 'Al Nile' },
  { id: 'American Typewriter', name: 'American Typewriter' },
  { id: 'Apple Color Emoji', name: 'Apple Color Emoji' },
  { id: 'Apple SD Gothic Neo', name: 'Apple SD Gothic Neo' },
  { id: 'Apple Symbols', name: 'Apple Symbols' },
  { id: 'Arial', name: 'Arial' },
  { id: 'Arial Hebrew', name: 'Arial Hebrew' },
  { id: 'Arial Rounded MT Bold', name: 'Arial Rounded MT Bold' },
  { id: 'Avenir', name: 'Avenir' },
  { id: 'Avenir Next', name: 'Avenir Next' },
  { id: 'Avenir Next Condensed', name: 'Avenir Next Condensed' },
  { id: 'Baskerville', name: 'Baskerville' },
  { id: 'Bodoni 72', name: 'Bodoni 72' },
  { id: 'Bodoni 72 Oldstyle', name: 'Bodoni 72 Oldstyle' },
  { id: 'Bodoni 72 Smallcaps', name: 'Bodoni 72 Smallcaps' },
  { id: 'Bodoni Ornaments', name: 'Bodoni Ornaments' },
  { id: 'Bradley Hand', name: 'Bradley Hand' },
  { id: 'Chalkboard SE', name: 'Chalkboard SE' },
  { id: 'Chalkduster', name: 'Chalkduster' },
  { id: 'Charter', name: 'Charter' },
  { id: 'Cochin', name: 'Cochin' },
  { id: 'Copperplate', name: 'Copperplate' },
  { id: 'Courier New', name: 'Courier New' },
  { id: 'Damascus', name: 'Damascus' },
  { id: 'Devanagari Sangam MN', name: 'Devanagari Sangam MN' },
  { id: 'Didot', name: 'Didot' },
  { id: 'DIN Alternate', name: 'DIN Alternate' },
  { id: 'DIN Condensed', name: 'DIN Condensed' },
  { id: 'Euphemia UCAS', name: 'Euphemia UCAS' },
  { id: 'Farah', name: 'Farah' },
  { id: 'Futura', name: 'Futura' },
  { id: 'Galvji', name: 'Galvji' },
  { id: 'Geeza Pro', name: 'Geeza Pro' },
  { id: 'Georgia', name: 'Georgia' },
  { id: 'Gill Sans', name: 'Gill Sans' },
  { id: 'Grantha Sangam MN', name: 'Grantha Sangam MN' },
  { id: 'Helvetica', name: 'Helvetica' },
  { id: 'Helvetica Neue', name: 'Helvetica Neue' },
  { id: 'Hiragino Maru Gothic ProN', name: 'Hiragino Maru Gothic ProN' },
  { id: 'Hiragino Mincho ProN', name: 'Hiragino Mincho ProN' },
  { id: 'Hiragino Sans', name: 'Hiragino Sans' },
  { id: 'Hoefler Text', name: 'Hoefler Text' },
  { id: 'Impact', name: 'Impact' },
  { id: 'Kailasa', name: 'Kailasa' },
  { id: 'Kefa', name: 'Kefa' },
  { id: 'Khmer Sangam MN', name: 'Khmer Sangam MN' },
  { id: 'Kohinoor Bangla', name: 'Kohinoor Bangla' },
  { id: 'Kohinoor Devanagari', name: 'Kohinoor Devanagari' },
  { id: 'Kohinoor Gujarati', name: 'Kohinoor Gujarati' },
  { id: 'Kohinoor Telugu', name: 'Kohinoor Telugu' },
  { id: 'Lao Sangam MN', name: 'Lao Sangam MN' },
  { id: 'Malayalam Sangam MN', name: 'Malayalam Sangam MN' },
  { id: 'Marker Felt', name: 'Marker Felt' },
  { id: 'Menlo', name: 'Menlo' },
  { id: 'Mishafi', name: 'Mishafi' },
  { id: 'Mukta Mahee', name: 'Mukta Mahee' },
  { id: 'Myanmar Sangam MN', name: 'Myanmar Sangam MN' },
  { id: 'Noteworthy', name: 'Noteworthy' },
  { id: 'Noto Nastaliq Urdu', name: 'Noto Nastaliq Urdu' },
  { id: 'Noto Sans Kannada', name: 'Noto Sans Kannada' },
  { id: 'Noto Sans Myanmar', name: 'Noto Sans Myanmar' },
  { id: 'Noto Sans Oriya', name: 'Noto Sans Oriya' },
  { id: 'Open Sans', name: 'Open Sans' },
  { id: 'Optima', name: 'Optima' },
  { id: 'Palatino', name: 'Palatino' },
  { id: 'Papyrus', name: 'Papyrus' },
  { id: 'Party LET', name: 'Party LET' },
  { id: 'PingFang HK', name: 'PingFang HK' },
  { id: 'PingFang SC', name: 'PingFang SC' },
  { id: 'PingFang TC', name: 'PingFang TC' },
  { id: 'Rockwell', name: 'Rockwell' },
  { id: 'Savoye LET', name: 'Savoye LET' },
  { id: 'Sinhala Sangam MN', name: 'Sinhala Sangam MN' },
  { id: 'Snell Roundhand', name: 'Snell Roundhand' },
  { id: 'STIX Two Math', name: 'STIX Two Math' },
  { id: 'STIX Two Text', name: 'STIX Two Text' },
  { id: 'Symbol', name: 'Symbol' },
  { id: 'Tamil Sangam MN', name: 'Tamil Sangam MN' },
  { id: 'Thonburi', name: 'Thonburi' },
  { id: 'Times New Roman', name: 'Times New Roman' },
  { id: 'Trebuchet MS', name: 'Trebuchet MS' },
  { id: 'Verdana', name: 'Verdana' },
  { id: 'Zapf Dingbats', name: 'Zapf Dingbats' },
  { id: 'Zapfino', name: 'Zapfino' },
];

//TODO hard copy from app. improve later
const FILTERS = [
  {
    id: 'chrome',
    name: 'chrome',
  },
  {
    id: 'fade',
    name: 'fade',
  },
  {
    id: 'instant',
    name: 'instant',
  },
  {
    id: 'noir',
    name: 'noir',
  },
  {
    id: 'process',
    name: 'process',
  },
  {
    id: 'tonal',
    name: 'tonal',
  },
  {
    id: 'transfer',
    name: 'transfer',
  },
  {
    id: 'sepia',
    name: 'sepia',
  },
  {
    id: 'thermal',
    name: 'thermal',
  },
  {
    id: 'xray',
    name: 'xray',
  },
  {
    id: 'documentary',
    name: 'documentary',
  },
  {
    id: 'negative',
    name: 'negative',
  },
  {
    id: 'posterize',
    name: 'posterize',
  },
];
//TODO: use it when all bg have a name, filter fomr RA have issue here
export const filterToQuery = (searchText: string) => ({
  name: `%${searchText}%`,
});
