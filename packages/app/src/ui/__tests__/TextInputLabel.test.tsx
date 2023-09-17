import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import TextInputLabel from '../TextInputLabel';

describe('TextInputLabel', () => {
  test('should render the label and input component', () => {
    const labelText = 'Enter your Name';
    const { getByText, getByPlaceholderText } = render(
      <TextInputLabel
        labelID="testLabel"
        label={labelText}
        placeholder="Your Name"
        onChangeText={jest.fn()}
      />,
    );

    expect(getByText(labelText)).toBeDefined();
    expect(getByPlaceholderText('Your Name')).toBeDefined();
  });

  test('should call the onChangeText callback when text is entered', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <TextInputLabel
        labelID="testLabel"
        label="Enter your name"
        onChangeText={onChangeText}
        placeholder="Your Name"
      />,
    );
    const input = getByPlaceholderText('Your Name');

    fireEvent.changeText(input, 'John');

    expect(onChangeText).toHaveBeenCalledWith('John');
  });
});
