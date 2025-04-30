/* eslint-disable react/display-name */
import { useForm } from 'react-hook-form';
import { RelayEnvironmentProvider } from 'react-relay';
import { createMockEnvironment } from 'relay-test-utils';
import { render } from '#helpers/testHelpers';
import ContactCardEditForm from '../ContactCardEditForm';
import type { ImagePickerProps } from '#components/ImagePicker/ImagePicker';
import type { ContactCardEditFormFragment_profile$data } from '#relayArtifacts/ContactCardEditFormFragment_profile.graphql';
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

// Mock ContactCardEditCompanyLogo component
jest.mock('../ContactCardEditCompanyLogo', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return ({
    canEditLogo = true,
    isPremium,
    company,
  }: {
    canEditLogo: boolean;
    isPremium: boolean;
    company: string;
  }) => (
    <View testID="companyLogoScreen">
      <View testID="companyLogoCanEditLogo" visible={canEditLogo} />
      <View testID="companyLogoIsPremium" visible={isPremium} />
      <Text testID="companyName">{company}</Text>
    </View>
  );
});

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

describe('ContactCardEditForm', () => {
  test('can edit logo on personal webcard with logo', async () => {
    const { getByTestId } = renderComponent({
      initialValues: {
        company: 'azzapp',
        phoneNumbers: [],
        emails: [],
        urls: [],
        addresses: [],
        socials: [],
        logo: { id: 'logo', uri: 'url' },
      },
      webCard: {
        id: 'webcardId',
        commonInformation: null,
        isMultiUser: false,
        isPremium: false,
        logo: null,
        userName: null,
        banner: null,
      },
    });
    const companyLogoCanEditLogo = getByTestId('companyLogoCanEditLogo');
    expect(companyLogoCanEditLogo.props.visible).toBe(true);
    const companyName = getByTestId('companyName');
    expect(companyName.props.children).toBe('azzapp');
  });

  test('cannot edit logo on multiUser webcard', async () => {
    const { getByTestId } = renderComponent({
      initialValues: INITIAL_VALUES,
      webCard: {
        id: 'webCardId',
        commonInformation: {
          company: 'azzappCommon',
          addresses: null,
          emails: null,
          phoneNumbers: null,
          socials: null,
          urls: null,
        },
        isMultiUser: true,
        isPremium: false,
        logo: { uri: 'https://bla.com', id: 'bla' },
        banner: { uri: 'https://bla.com', id: 'bla', width: 220, height: 50 },
        userName: null,
      },
    });
    const companyLogoCanEditLogo = getByTestId('companyLogoCanEditLogo');
    expect(companyLogoCanEditLogo.props.visible).toBe(false);
    const companyName = getByTestId('companyName');
    expect(companyName.props.children).toBe('azzappCommon');
  });
  test('can edit logo on personal webcard and multiUser data available', async () => {
    const { getByTestId } = renderComponent({
      initialValues: {
        company: 'azzapp',
        phoneNumbers: [],
        emails: [],
        urls: [],
        addresses: [],
        socials: [],
        logo: { id: 'logo', uri: 'url' },
      },
      webCard: {
        id: 'webCardId',
        commonInformation: {
          company: 'azzappCommon',
          addresses: null,
          emails: null,
          phoneNumbers: null,
          socials: null,
          urls: null,
        },
        isMultiUser: false,
        isPremium: false,
        logo: { uri: 'https://bla.com', id: 'bla' },
        banner: { uri: 'https://bla.com', id: 'bla', width: 220, height: 50 },
        userName: null,
      },
    });
    const companyLogoCanEditLogo = getByTestId('companyLogoCanEditLogo');
    expect(companyLogoCanEditLogo.props.visible).toBe(true);
    const companyName = getByTestId('companyName');
    expect(companyName.props.children).toBe('azzapp');
  });
  test('cannot edit logo on multiUser webcard with personal data available', async () => {
    const { getByTestId } = renderComponent({
      initialValues: {
        company: 'azzapp',
        phoneNumbers: [],
        emails: [],
        urls: [],
        addresses: [],
        socials: [],
        logo: { id: 'logo', uri: 'url' },
      },
      webCard: {
        id: 'webCardId',
        commonInformation: {
          company: 'azzappCommon',
          addresses: null,
          emails: null,
          phoneNumbers: null,
          socials: null,
          urls: null,
        },
        isMultiUser: true,
        isPremium: false,
        logo: { uri: 'https://bla.com', id: 'bla' },
        banner: { uri: 'https://bla.com', id: 'bla', width: 220, height: 50 },
        userName: null,
      },
    });
    const companyLogoCanEditLogo = getByTestId('companyLogoCanEditLogo');
    expect(companyLogoCanEditLogo.props.visible).toBe(false);
    const companyName = getByTestId('companyName');
    expect(companyName.props.children).toBe('azzappCommon');
  });
});

const renderComponent = ({
  initialValues,
  webCard,
}: {
  initialValues: ContactCardFormValues;
  webCard: NonNullable<
    NonNullable<ContactCardEditFormFragment_profile$data>
  >['webCard'];
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
    return <ContactCardEditForm control={form.control} webCard={webCard} />;
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
