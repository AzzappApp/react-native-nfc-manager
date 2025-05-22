'use client';

import classNames from 'classnames';
import { forwardRef, type InputHTMLAttributes } from 'react';
import {
  textField,
  textMedium,
  textSmallBold,
} from '#app/[userName]/theme.css';
import formInputStyles, { INPUT_HEIGHT } from '../FormInput/FormInput.css';
import { containerWithPrefix, inputContainer, prefixSpan } from './Input.css';

export type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  prefix?: string;
  error?: boolean;
  warning?: boolean;
  errorLabel?: string;
  inputSize?: 'medium' | 'small';
  inputClassName?: string;
};

// eslint-disable-next-line react/display-name
const Input = forwardRef<HTMLInputElement, FormInputProps>((props, ref) => {
  const {
    label,
    prefix,
    error,
    warning,
    errorLabel,
    className,
    style,
    width,
    height = INPUT_HEIGHT,
    inputSize = 'small',
    inputClassName,
    ...inputProps
  } = props;

  return (
    <div className={classNames(inputContainer, className)} style={style}>
      {label && (
        <label
          htmlFor={inputProps.name}
          className={classNames(
            textSmallBold,
            inputSize === 'medium' && textMedium,
          )}
        >
          {label}
        </label>
      )}
      <div className={containerWithPrefix}>
        {prefix && <span className={prefixSpan}>{prefix}</span>}
        <input
          ref={ref}
          className={classNames(
            formInputStyles.input,
            inputClassName,
            inputSize === 'medium' && textField,
            error && formInputStyles.inputOnError,
            warning && formInputStyles.inputOnWarning,
          )}
          style={{
            width,
            height,
            paddingLeft: prefix && 5,
          }}
          {...inputProps}
        />
      </div>
      {errorLabel && (
        <div className={formInputStyles.inputError}>{errorLabel}</div>
      )}
    </div>
  );
});

export default Input;
