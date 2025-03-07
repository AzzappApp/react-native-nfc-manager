/* eslint-disable react/display-name */
import { useForm } from 'react-hook-form';
import { act, fireEvent, render, waitFor } from '#helpers/testHelpers';
import ContactCardEditCompanyColor from '../ContactCardEditCompanyColor';
import type { ColorChooserProps } from '#ui/ColorPicker/ColorChooser';
import type { ContactCardFormValues } from '../ContactCardSchema';
import type { UseFormGetValues } from 'react-hook-form';

// Mock react-native-image-colors
jest.mock('react-native-image-colors', () => ({
  getColors: jest.fn().mockResolvedValue({
    platform: 'ios',
    primary: '#FF0000',
    secondary: '#00FF00',
    detail: '#0000FF',
    background: '#FFFFFF',
    dominant: '#FF0000',
    vibrant: '#00FF00',
    lightVibrant: '#0000FF',
  }),
  cache: {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
  },
}));

jest.mock('#ui/ColorPicker/ColorChooser', () => {
  const { Pressable } = require('react-native');
  return ({ onColorChange }: ColorChooserProps) => {
    return (
      <Pressable
        testID="color_chooser_button"
        onPress={() => onColorChange('#ABDD44')}
      >
        Choose Color
      </Pressable>
    );
  };
});

// the component only appear when the company logo is set, we assumed the value is not null
describe('ContactCardEditCompanyColor', () => {
  test('should have the correct hex label color (#FF0000) from  on first render', async () => {
    const { getByTestId } = renderComponent({
      initialValues: INITIAL_VALUES,
    });

    const colorBox = getByTestId('companyColor_label_color');

    await waitFor(() => {
      expect(colorBox.props.children).toEqual('#FF0000');
    });
  });

  test('should have the correct expendable color', async () => {
    const { getValues } = renderComponent({
      initialValues: INITIAL_VALUES,
    });

    await waitFor(() => {
      expect(getValues().expendableColor).toEqual('#FFFFFF');
    });
  });

  test('should open the color picker when the color box is pressed', async () => {
    const { getByTestId } = renderComponent({
      initialValues: INITIAL_VALUES,
    });
    const colorBox = getByTestId('companycolor_color_box');
    act(() => {
      fireEvent.press(colorBox);
    });
    await waitFor(() => {
      expect(getByTestId('color_chooser_button')).toBeTruthy();
    });
  });

  test('should update `primaryColor` properly when defining a color in colorPicker', async () => {
    const { getByTestId, getValues } = renderComponent({
      initialValues: INITIAL_VALUES,
    });
    const colorChooserButton = getByTestId('color_chooser_button');
    act(() => {
      fireEvent.press(colorChooserButton);
    });
    await waitFor(() => {
      expect(getValues().primaryColor).toEqual('#ABDD44');
    });
  });

  test('should update the primary color in the form when selecting a color', async () => {
    const { getByTestId, getValues } = renderComponent({
      initialValues: INITIAL_VALUES,
    });

    const colorPreview = getByTestId('companycolor_color_preview_#0FD59E');
    fireEvent.press(colorPreview);
    await waitFor(() => {
      expect(getValues().primaryColor).toEqual('#0FD59E');
    });
  });
});

const renderComponent = ({
  initialValues,
}: {
  initialValues: ContactCardFormValues;
}) => {
  let getValues: UseFormGetValues<ContactCardFormValues>;

  const Wrapper = () => {
    const form = useForm<ContactCardFormValues>({
      defaultValues: initialValues,
    });
    getValues = form.getValues;
    return <ContactCardEditCompanyColor control={form.control} />;
  };
  return {
    ...render(<Wrapper />),
    //@ts-expect-error must be defined before using it
    getValues,
  };
};
const INITIAL_VALUES: ContactCardFormValues = {
  company: 'azzapp',
  phoneNumbers: [],
  logo: {
    id: '2',
    uri: 'new_mock_logo_uri',
    width: 1280,
    height: 1280,
    local: true,
  },
  emails: [],
  urls: [],
  addresses: [],
  socials: [],
};
