/* eslint-disable react/display-name */
import { useForm } from 'react-hook-form';
import { RelayEnvironmentProvider } from 'react-relay';
import { createMockEnvironment } from 'relay-test-utils';
import { act, fireEvent, render, waitFor } from '#helpers/testHelpers';
import ContactCardEditCompanyLogo from '../ContactCardEditCompanyLogo';
import type { ImagePickerProps } from '#components/ImagePicker/ImagePicker';
import type { ContactCardFormValues } from '../ContactCardSchema';
import type { ReactNode } from 'react';
import type { UseFormGetValues } from 'react-hook-form';

// Start to mock everything, the whole planet earth
jest.mock('#components/ImagePicker', () => {
  const React = require('react');
  const { View, Pressable } = require('react-native');
  return ({ onFinished, onCancel }: ImagePickerProps) => {
    const handleSelectImage = () => {
      onFinished?.({
        id: 'mock_id',
        uri: 'mock_uri',
        width: 100,
        height: 100,
        kind: 'image',
        rotation: 0,
        aspectRatio: 0,
        editionParameters: {},
        filter: null,
        timeRange: null,
        duration: null,
      });
    };

    const handleCancel = () => {
      onCancel?.();
    };

    return (
      <View testID="mock_image_picker">
        <Pressable
          onPress={handleSelectImage}
          testID="mock_image_picker_select"
        />
        <Pressable onPress={handleCancel} testID="mock_image_picker_cancel" />
      </View>
    );
  };
});

// Mock the saveTransformedImageToFile function
jest.mock('#helpers/mediaEditions', () => ({
  saveTransformedImageToFile: jest.fn().mockResolvedValue('mock_local_path'),
}));

// Mock ScreenModal component
jest.mock('#components/NativeRouter/ScreenModal', () => {
  const React = require('react');
  const { View, Modal } = require('react-native');

  return ({ visible, children }: { visible: boolean; children: ReactNode }) => (
    <Modal visible={visible} transparent>
      <View testID="screen_modal">{children}</View>
    </Modal>
  );
});

describe('ContactCardEditCompanyLogo', () => {
  test('open the image picker when the add button is pressed', async () => {
    const { getByTestId } = renderComponent({
      initialValues: INITIAL_VALUES,
    });

    const addButton = getByTestId('companylogo_add_logo');
    fireEvent.press(addButton);
    await waitFor(() => {
      expect(getByTestId('screen_modal')).toBeTruthy();
    });
  });

  test('display the logo when selected from the image picker', async () => {
    const { getByTestId } = renderComponent({
      initialValues: INITIAL_VALUES,
    });

    const addButton = getByTestId('companylogo_add_logo');
    fireEvent.press(addButton);
    await waitFor(() => {
      expect(getByTestId('screen_modal')).toBeTruthy();
    });
    //fire the onFinished callback
    const selectImageButton = getByTestId('mock_image_picker_select');
    fireEvent.press(selectImageButton);
    await waitFor(() => {
      expect(getByTestId('companylogo_picker_logo_manual')).toBeTruthy();
    });
  });

  test('should display the logo fetch by the api', async () => {
    const { getByTestId, environment } = renderComponent({
      initialValues: {
        company: 'azzapp',
        phoneNumbers: [],
        emails: [],
        urls: [],
        addresses: [],
        socials: [],
      },
    });

    act(() => {
      environment.mock.resolveMostRecentOperation({
        data: {
          extractCompanyLogo: [
            { id: '1', score: 0.9, uri: 'mock_logo_uri_1' },
            { id: '2', score: 0.8, uri: 'mock_logo_uri_2' },
            { id: '3', score: 0.7, uri: 'mock_logo_uri_3' },
          ],
        },
      });
    });

    await waitFor(() => {
      expect(getByTestId('logoItem-1')).toBeTruthy();
      expect(getByTestId('logoItem-2')).toBeTruthy();
      expect(getByTestId('logoItem-3')).toBeTruthy();
    });
  });

  test('should update the logo in the form when selecting it', async () => {
    const { getByTestId, environment, getValues } = renderComponent({
      initialValues: INITIAL_VALUES,
    });

    act(() => {
      environment.mock.resolveMostRecentOperation({
        data: {
          extractCompanyLogo: [
            { id: '1', score: 0.9, uri: 'mock_logo_uri_1' },
            { id: '2', score: 0.8, uri: 'mock_logo_uri_2' },
            { id: '3', score: 0.7, uri: 'mock_logo_uri_3' },
          ],
        },
      });
    });

    await waitFor(() => {
      expect(getByTestId('logoItem-1')).toBeTruthy();
      expect(getByTestId('logoItem-2')).toBeTruthy();
      expect(getByTestId('logoItem-3')).toBeTruthy();
    });

    const logoItem = getByTestId('logoItem-1');
    fireEvent.press(logoItem);

    await waitFor(() => {
      expect(getValues().logo).toEqual({
        id: '1',
        uri: 'mock_logo_uri_1',
        width: 1280,
        height: 1280,
        local: true,
      });
    });
  });
});

const renderComponent = ({
  initialValues,
}: {
  initialValues: ContactCardFormValues;
}) => {
  const environment = createMockEnvironment();

  let getValues: UseFormGetValues<ContactCardFormValues>;

  const Wrapper = () => {
    'use no memo';
    const form = useForm<ContactCardFormValues>({
      defaultValues: initialValues,
    });
    // eslint-disable-next-line react-compiler/react-compiler
    getValues = form.getValues;
    return <ContactCardEditCompanyLogo control={form.control} />;
  };
  return {
    ...render(
      <RelayEnvironmentProvider environment={environment}>
        <Wrapper />
      </RelayEnvironmentProvider>,
    ),
    environment,
    //@ts-expect-error must be defined before using it
    getValues,
  };
};
const INITIAL_VALUES: ContactCardFormValues = {
  company: 'azzapp',
  phoneNumbers: [],
  emails: [],
  urls: [],
  addresses: [],
  socials: [],
};
